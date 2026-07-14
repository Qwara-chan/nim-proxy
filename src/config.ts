import { Env, Config } from './types'

export function loadConfig(env: Env): Config {
  const keys = env.NIM_API_KEYS
    ? env.NIM_API_KEYS.split(',').map(k => k.trim()).filter(Boolean)
    : []

  if (keys.length === 0) {
    throw new Error('NIM_API_KEYS is required')
  }

  return {
    keys,
    allowedModels: env.NIM_ALLOWED_MODELS
    ? env.NIM_ALLOWED_MODELS.split(',').map(m => m.trim()).filter(Boolean)
    : null,
    baseUrl: env.NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1',
    maxRetries: parseInt(env.NIM_MAX_RETRIES || '3'),
    keyCooldown: parseInt(env.NIM_KEY_COOLDOWN || '60'),
    requestTimeout: parseInt(env.NIM_REQUEST_TIMEOUT || '30000'),
    logLevel: (env.NIM_LOG_LEVEL as Config['logLevel']) || 'info',
  }
}

export function isModelAllowed(config: Config, model: string): boolean {
  if (!config.allowedModels || config.allowedModels.length === 0) {
    return true
  }
  return config.allowedModels.includes(model)
}
