import { corsHeaders } from './utils'

function parseCookies(cookieHeader: string): Record<string, string> {
  const result: Record<string, string> = {}
  if (!cookieHeader) return result
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=')
    if (eq < 0) continue
    const key = part.slice(0, eq).trim()
    const val = part.slice(eq + 1).trim()
    if (key) result[key] = decodeURIComponent(val)
  }
  return result
}

// Constant-time string comparison. Pads the shorter operand so length also
// doesn't leak. Returns true iff both inputs are byte-identical.
function safeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length)
  let diff = a.length ^ b.length
  for (let i = 0; i < len; i++) {
    const ac = i < a.length ? a.charCodeAt(i) : 0
    const bc = i < b.length ? b.charCodeAt(i) : 0
    diff |= ac ^ bc
  }
  return diff === 0
}

export function checkAuth(request: Request, token: string): boolean {
  if (!token) return true

  const authHeader = request.headers.get('Authorization')
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i)
    if (match && safeEqual(match[1], token)) return true
  }

  const cookies = parseCookies(request.headers.get('Cookie') || '')
  const cookieToken = cookies.nim_chat_token
  if (cookieToken && safeEqual(cookieToken, token)) return true

  return false
}

export function unauthorizedResponse(): Response {
  return new Response(
    JSON.stringify({
      error: {
        message: 'Unauthorized: Invalid or missing API key',
        type: 'authentication_error',
      },
    }),
    {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    }
  )
}

export function hasSessionCookie(request: Request, token: string): boolean {
  if (!token) return true
  const cookies = parseCookies(request.headers.get('Cookie') || '')
  const cookieToken = cookies.nim_chat_token
  if (!cookieToken) return false
  return safeEqual(cookieToken, token)
}

export function safeCompare(a: string, b: string): boolean {
  return safeEqual(a, b)
}

const EXPIRES_PAST = 'Thu, 01 Jan 1970 00:00:00 GMT'

export function sessionCookie(token: string, maxAge = 60 * 60 * 24 * 7, secure = true): string {
  const value = encodeURIComponent(token)
  const parts = [
    `nim_chat_token=${value}`,
    'HttpOnly',
    'SameSite=Strict',
    'Path=/',
    `Max-Age=${maxAge}`,
  ]
  if (secure) parts.push('Secure')
  return parts.join('; ')
}

export function clearSessionCookie(): string {
  return `nim_chat_token=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0; Expires=${EXPIRES_PAST}`
}
