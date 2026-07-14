export interface Env {
  NIM_API_KEYS: string
  NIM_ALLOWED_MODELS: string
  PROXY_AUTH_TOKEN: string
  NIM_BASE_URL: string
  NIM_MAX_RETRIES: string
  NIM_KEY_COOLDOWN: string
  NIM_LOG_LEVEL: string
  NIM_REQUEST_TIMEOUT: string
}

export interface Config {
  keys: string[]
  allowedModels: string[] | null
  baseUrl: string
  maxRetries: number
  keyCooldown: number
  requestTimeout: number
  logLevel: 'debug' | 'info' | 'warn' | 'error'
}

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_calls?: unknown[]
  tool_call_id?: string
}

export interface ChatCompletionRequest {
  model: string
  messages: Message[]
  stream?: boolean
  temperature?: number
  top_p?: number
  max_tokens?: number
  frequency_penalty?: number
  presence_penalty?: number
  stop?: string | string[]
  tools?: unknown[]
  tool_choice?: unknown
  [key: string]: unknown
}

export interface KeyState {
  id: string
  key: string
  healthy: boolean
  cooldownUntil: number
  errorCount: number
  requestCount: number
}

export interface RequestData {
  requestId: string
  model: string
  keyId: string
  status: number
  latency: number
  prefixHash: string
  stream: boolean
}

export interface Stats {
  totalRequests: number
  streamRequests: number
  models: Record<string, number>
  keys: Record<string, { requests: number; healthy: boolean }>
  errors: { total: number; byKey: Record<string, number> }
  startedAt: string
}
