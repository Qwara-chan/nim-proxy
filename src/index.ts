import { Env, Config, ChatCompletionRequest } from './types'
import { loadConfig, isModelAllowed } from './config'
import {
  checkAuth,
  unauthorizedResponse,
  hasSessionCookie,
  sessionCookie,
  clearSessionCookie,
  safeCompare,
} from './auth'
import { ConsistentHash } from './consistentHash'
import { proxyWithRouting, proxyPassthrough } from './proxy'
import { getStatsResponse } from './stats'
import { corsHeaders } from './utils'
import { helperPageHTML } from './pages/helper'
import { loginPageHTML, chatUIHTML } from './pages/chat'
import { statsPageHTML } from './pages/stats'

let hashRing: ConsistentHash | null = null
let config: Config | null = null

function getConfig(env: Env): Config {
  if (!config) {
    config = loadConfig(env)
  }
  return config
}

function getHashRing(env: Env): ConsistentHash {
  if (!hashRing) {
    const cfg = getConfig(env)
    const keys = cfg.keys.map((key, i) => ({ id: `key_${i}`, key }))
    hashRing = new ConsistentHash(keys)
  }
  return hashRing
}

function htmlResponse(html: string, status = 200): Response {
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "frame-ancestors 'none'",
      ...corsHeaders(),
    },
  })
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: { message, type: 'invalid_request_error' } }), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}

function configMissingResponse(): Response {
  const body = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>nim-proxy · not configured</title>
<style>body{font-family:system-ui,sans-serif;max-width:560px;margin:6rem auto;padding:0 1.5rem;color:#000;line-height:1.7}
h1{font-size:1.4rem;margin:0 0 .8rem}code{background:#f0f0f0;padding:.1em .4em;border-radius:3px}
p{color:#666}</style></head><body>
<h1>Worker 未配置</h1>
<p>检测到 <code>NIM_API_KEYS</code> 为空。请通过以下命令配置至少一个 NVIDIA NIM API Key 后重新部署：</p>
<pre style="background:#f5f5f5;padding:1rem;border-radius:4px;border:1px solid #ddd"><code>npx wrangler secret put NIM_API_KEYS
# 输入: nvapi-xxx,nvapi-yyy</code></pre>
<p>设置 Secret 后 <code>npx wrangler deploy</code> 即可。</p>
</body></html>`
  return new Response(body, {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders(),
    },
  })
}

function safeConfig(env: Env): Config | null {
  try {
    return getConfig(env)
  } catch {
    return null
  }
}

function safeHashRing(env: Env): ConsistentHash | null {
  try {
    return getHashRing(env)
  } catch {
    return null
  }
}

function sanitizeNext(raw: unknown): string {
  if (!raw || typeof raw !== 'string') return '/chat'
  if (raw.length > 512) return '/chat'
  if (raw[0] !== '/' || raw[1] === '/' || raw[1] === '\\') return '/chat'
  // Reject control characters and whitespace that could confuse header parsers
  if (/[\r\n\t\0]/.test(raw)) return '/chat'
  return raw
}

function isHttps(request: Request): boolean {
  try {
    return new URL(request.url).protocol === 'https:'
  } catch {
    return false
  }
}

async function handleChatLogin(request: Request, env: Env): Promise<Response> {
  const contentType = request.headers.get('Content-Type') || ''
  let password = ''
  let nextPath = '/chat'

  try {
    if (contentType.includes('application/json')) {
      const body = (await request.json()) as { token?: string; password?: string; next?: string }
      password = body.token || body.password || ''
      nextPath = sanitizeNext(body.next)
    } else {
      const form = await request.formData()
      password = String(form.get('token') || '')
      nextPath = sanitizeNext(String(form.get('next') || ''))
    }
  } catch {
    return htmlResponse(loginPageHTML('请求格式无效', nextPath))
  }

  const expected = env.PROXY_AUTH_TOKEN || ''
  if (!expected) {
    return redirect(nextPath)
  }

  if (!safeCompare(password, expected)) {
    return htmlResponse(loginPageHTML('令牌不正确，请重试', nextPath))
  }

  return redirect(nextPath, 302, { 'Set-Cookie': sessionCookie(expected, 60 * 60 * 24 * 7, isHttps(request)) })
}

async function handleChatLogout(request: Request): Promise<Response> {
  return redirect('/chat', 302, { 'Set-Cookie': clearSessionCookie() })
}

function chatPageResponse(request: Request, env: Env): Response {
  const expected = env.PROXY_AUTH_TOKEN || ''
  const hasSession = hasSessionCookie(request, expected)

  if (expected && !hasSession) {
    let next = '/chat'
    try {
      next = sanitizeNext(new URL(request.url).searchParams.get('next'))
    } catch {
      next = '/chat'
    }
    return htmlResponse(loginPageHTML(undefined, next))
  }
  return htmlResponse(chatUIHTML())
}

function redirect(location: string, status = 302, extraHeaders?: Record<string, string>): Response {
  return new Response(null, {
    status,
    headers: { Location: location, ...corsHeaders(), ...(extraHeaders || {}) },
  })
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() })
    }

    const url = new URL(request.url)
    const path = url.pathname
    const method = request.method

    // ============================================================
    // Public routes that never need config
    // ============================================================

    if (path === '/' && method === 'GET') {
      return htmlResponse(helperPageHTML())
    }

    if (path === '/health' && method === 'GET') {
      return new Response('OK', {
        status: 200,
        headers: { 'Cache-Control': 'no-store', ...corsHeaders() },
      })
    }

    if (path === '/chat/login' && method === 'POST') {
      return handleChatLogin(request, env)
    }

    if (path === '/chat/logout' && method === 'POST') {
      return handleChatLogout(request)
    }

    if (path === '/chat' && method === 'GET') {
      return chatPageResponse(request, env)
    }

    // /stats page: HTML when Accept includes text/html, JSON otherwise.
    // HTML uses cookie session auth (browser-friendly), JSON uses Bearer (or cookie).
    if (path === '/stats' && method === 'GET') {
      const accept = request.headers.get('Accept') || ''
      const wantsHtml = accept.indexOf('text/html') !== -1

      if (wantsHtml) {
        const expected = env.PROXY_AUTH_TOKEN || ''
        if (expected && !hasSessionCookie(request, expected)) {
          return htmlResponse(loginPageHTML(undefined, '/stats'))
        }
        return htmlResponse(statsPageHTML())
      }
      // JSON API
      if (env.PROXY_AUTH_TOKEN && !checkAuth(request, env.PROXY_AUTH_TOKEN)) {
        return unauthorizedResponse()
      }
      const ring = safeHashRing(env)
      if (!ring) return configMissingResponse()
      const resp = getStatsResponse(ring.getAllKeyStates())
      return addCorsHeaders(resp)
    }

    // ============================================================
    // Public read-only passthrough (no auth, but needs config)
    // ============================================================

    if (
      (path === '/v1/models' && method === 'GET') ||
      (path.match(/^\/v1\/.+\/status\/.+$/) !== null && method === 'GET')
    ) {
      const cfg = safeConfig(env)
      const ring = safeHashRing(env)
      if (!cfg || !ring) return configMissingResponse()
      return proxyPassthrough(request, cfg, ring)
    }

    // ============================================================
    // Auth-gated routes
    // ============================================================

    if (env.PROXY_AUTH_TOKEN && !checkAuth(request, env.PROXY_AUTH_TOKEN)) {
      return unauthorizedResponse()
    }

    const cfg = safeConfig(env)
    const ring = safeHashRing(env)
    if (!cfg || !ring) return configMissingResponse()

    const inferencePaths = [
      '/v1/chat/completions',
      '/v1/completions',
      '/v1/embeddings',
      '/v1/ranking',
    ]

    if (inferencePaths.includes(path) && method === 'POST') {
      let body: ChatCompletionRequest
      try {
        body = (await request.json()) as ChatCompletionRequest
      } catch {
        return jsonError('Invalid JSON', 400)
      }

      if (body.model && !isModelAllowed(cfg, body.model)) {
        return jsonError(`Model '${body.model}' is not allowed`, 400)
      }

      return proxyWithRouting(request, body, cfg, ring)
    }

    return jsonResponse({ error: { message: 'Not found', type: 'not_found' } }, 404)
  },
}

function jsonResponse(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}

function addCorsHeaders(response: Response): Response {
  const newHeaders = new Headers(response.headers)
  for (const [key, value] of Object.entries(corsHeaders())) {
    newHeaders.set(key, value)
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  })
}
