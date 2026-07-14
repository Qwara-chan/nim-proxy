import { Config, ChatCompletionRequest, Message, RequestData } from './types'
import { ConsistentHash } from './consistentHash'
import { recordRequest, recordError, updateKeyHealth } from './stats'
import { corsHeaders } from './utils'

// Exclude the last message (current user turn) so that identical prompts
// from different conversation turns still hash to the same ring position,
// improving cache hits on NVIDIA's side without affecting routing uniqueness.
function extractPrefix(messages: Message[]): string {
  const system = messages.find((m) => m.role === 'system')?.content || ''
  const prefixMessages = messages.slice(0, -1)
  const prefix = prefixMessages.map((m) => `${m.role}:${m.content ?? ''}`).join('\n')
  return system + prefix
}



function errorResponse(message: string, type: string, status: number, extra?: Record<string, unknown>): Response {
  return new Response(
    JSON.stringify({ error: { message, type, ...extra } }),
    { status, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
  )
}

export async function proxyWithRouting(
  request: Request,
  body: ChatCompletionRequest,
  config: Config,
  hashRing: ConsistentHash
): Promise<Response> {
  const requestId = crypto.randomUUID().slice(0, 8)
  const startTime = Date.now()

  const { model, messages, stream } = body

  if (!model) {
    return errorResponse('model is required', 'invalid_request_error', 400)
  }

  const prefix = messages ? extractPrefix(messages) : ''
  const prefixHash = hashRing.hash(`${model}:${prefix}`).toString(36)
  const incomingUrl = new URL(request.url)
  const targetPath = incomingUrl.pathname.replace(/^\/v1/, '')
  const targetUrl = `${config.baseUrl}${targetPath}${incomingUrl.search}`

  const bodyText = JSON.stringify(body)

  let keyId = hashRing.getRoute(model, prefix)
  if (!keyId) {
    return errorResponse('No healthy API keys available', 'server_error', 503)
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    const keyState = hashRing.getKeyState(keyId)
    if (!keyState) {
      return errorResponse('API key disappeared from ring', 'server_error', 500)
    }

    const currentKeyId: string = keyId!

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), config.requestTimeout)
      const nvidiaRequest = new Request(targetUrl, {
        method: request.method,
        headers: {
          Authorization: `Bearer ${keyState.key}`,
          'Content-Type': 'application/json',
          Accept: request.headers.get('Accept') || 'application/json',
        },
        body: bodyText,
        signal: controller.signal,
      })

      let response: Response
      try {
        response = await fetch(nvidiaRequest)
      } finally {
        clearTimeout(timeoutId)
      }

      if (!response.ok) {
        const errorText = await response.text()
        throw new ProxyError(response.status, errorText)
      }

      const isStream =
        stream && response.headers.get('content-type')?.includes('text/event-stream')

      recordRequest({
        requestId,
        model,
        keyId: currentKeyId,
        status: response.status,
        latency: Date.now() - startTime,
        prefixHash,
        stream: !!isStream,
      })

      hashRing.incrementRequests(currentKeyId)

      if (isStream) {
        const { readable, writable } = new TransformStream()
        const abortError = new Error('stream aborted')
        response.body?.pipeTo(writable).catch((err) => {
          try {
            writable.getWriter().abort(err ?? abortError)
          } catch {
            try {
              writable.abort(err ?? abortError)
            } catch {}
          }
        })
        return new Response(readable, {
          status: response.status,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            ...corsHeaders(),
          },
        })
      }

      return new Response(response.body, {
        status: response.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    } catch (error) {
      lastError = error as Error
      recordError(currentKeyId)

      if (error instanceof ProxyError) {
        if (error.status === 429) {
          hashRing.markCooldown(currentKeyId, config.keyCooldown)
          updateKeyHealth(currentKeyId, false)
        } else if (error.status === 401 || error.status === 403) {
          hashRing.markCooldown(currentKeyId, config.keyCooldown * 5)
          updateKeyHealth(currentKeyId, false)
        } else if (error.status >= 500) {
          hashRing.markCooldown(currentKeyId, config.keyCooldown)
          updateKeyHealth(currentKeyId, false)
        }
      }

      const nextKeyId = hashRing.getFailoverKey(currentKeyId, model, prefix)
      if (!nextKeyId || nextKeyId === currentKeyId) {
        break
      }
      keyId = nextKeyId
    }
  }

  return errorResponse(
    `All ${config.keys.length} API keys failed after ${config.maxRetries} retries`,
    'server_error',
    502,
    { request_id: requestId, last_error: lastError?.message }
  )
}

export async function proxyPassthrough(
  request: Request,
  config: Config,
  hashRing: ConsistentHash
): Promise<Response> {
  const keyId = hashRing.getRandomHealthyKey()
  const keyState = hashRing.getKeyState(keyId)
  if (!keyState) {
    return errorResponse('No API keys available', 'server_error', 500)
  }

  const incomingUrl = new URL(request.url)
  const targetPath = incomingUrl.pathname.replace(/^\/v1/, '')
  const targetUrl = `${config.baseUrl}${targetPath}${incomingUrl.search}`
  const nvidiaRequest = new Request(targetUrl, {
    method: request.method,
    headers: {
      Authorization: `Bearer ${keyState.key}`,
      Accept: request.headers.get('Accept') || 'application/json',
    },
  })

  const response = await fetch(nvidiaRequest)
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

class ProxyError extends Error {
  constructor(public readonly status: number, public readonly body: string) {
    super(`HTTP ${status}: ${body.slice(0, 200)}`)
    this.name = 'ProxyError'
  }
}