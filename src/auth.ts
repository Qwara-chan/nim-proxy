import { corsHeaders } from './utils'

export function checkAuth(request: Request, token: string): boolean {
  if (!token) return true

  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return false

  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  if (!match) return false

  return match[1] === token
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
