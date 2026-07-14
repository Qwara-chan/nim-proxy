import { Env, Config, ChatCompletionRequest } from './types'
import { loadConfig, isModelAllowed } from './config'
import { checkAuth, unauthorizedResponse } from './auth'
import { ConsistentHash } from './consistentHash'
import { proxyWithRouting, proxyPassthrough } from './proxy'
import { getStatsResponse } from './stats'
import { corsHeaders } from './utils'

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



export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() })
    }

    const url = new URL(request.url)
    const path = url.pathname

    const cfg = getConfig(env)

    if (env.PROXY_AUTH_TOKEN) {
      if (!checkAuth(request, env.PROXY_AUTH_TOKEN)) {
        return unauthorizedResponse()
      }
    }

    const ring = getHashRing(env)

    if (path === '/health') {
      return new Response('OK', { status: 200, headers: corsHeaders() })
    }

if (path === '/stats' && request.method === 'GET') {
  if (env.PROXY_AUTH_TOKEN) {
    if (!checkAuth(request, env.PROXY_AUTH_TOKEN)) {
      return unauthorizedResponse()
    }
  }
  const resp = getStatsResponse(ring.getAllKeyStates())
  return addCorsHeaders(resp)
}

    if (path === '/v1/models' && request.method === 'GET') {
      return proxyPassthrough(request, cfg, ring)
    }

    if (path.match(/^\/v1\/.+\/status\/.+$/) && request.method === 'GET') {
      return proxyPassthrough(request, cfg, ring)
    }

    const inferencePaths = [
      '/v1/chat/completions',
      '/v1/completions',
      '/v1/embeddings',
      '/v1/ranking',
    ]

    if (inferencePaths.includes(path) && request.method === 'POST') {
      let body: ChatCompletionRequest
      try {
        body = await request.json()
      } catch {
        return jsonResponse(
          { error: { message: 'Invalid JSON', type: 'invalid_request_error' } },
          400
        )
      }

      if (body.model && !isModelAllowed(cfg, body.model)) {
        return jsonResponse(
          {
            error: {
              message: `Model '${body.model}' is not allowed`,
              type: 'invalid_request_error',
            },
          },
          400
        )
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
