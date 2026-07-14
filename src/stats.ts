import { Stats, RequestData, KeyState } from './types'

const stats: Stats = {
  totalRequests: 0,
  streamRequests: 0,
  models: {},
  keys: {},
  errors: { total: 0, byKey: {} },
  startedAt: new Date().toISOString(),
}

export function recordRequest(data: RequestData): void {
  stats.totalRequests++
  if (data.stream) stats.streamRequests++

  stats.models[data.model] = (stats.models[data.model] || 0) + 1

  if (!stats.keys[data.keyId]) {
    stats.keys[data.keyId] = { requests: 0, healthy: true }
  }
  stats.keys[data.keyId].requests++
}

export function recordError(keyId: string): void {
  stats.errors.total++
  stats.errors.byKey[keyId] = (stats.errors.byKey[keyId] || 0) + 1
}

export function updateKeyHealth(keyId: string, healthy: boolean): void {
  if (!stats.keys[keyId]) {
    stats.keys[keyId] = { requests: 0, healthy }
  } else {
    stats.keys[keyId].healthy = healthy
  }
}

export function getStatsResponse(keyStates: Map<string, KeyState>): Response {
  const keys: Record<string, { requests: number; healthy: boolean; cooldownUntil?: string }> = {}

  for (const [id, state] of keyStates) {
    keys[id] = {
      requests: stats.keys[id]?.requests || 0,
      healthy: state.healthy && Date.now() > state.cooldownUntil,
    }
    if (state.cooldownUntil > Date.now()) {
      keys[id].cooldownUntil = new Date(state.cooldownUntil).toISOString()
    }
  }

  return new Response(
    JSON.stringify({
      uptime: stats.startedAt,
      total_requests: stats.totalRequests,
      stream_requests: stats.streamRequests,
      models: stats.models,
      keys,
      errors: stats.errors,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  )
}
