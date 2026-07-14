import { KeyState } from './types'

interface RingNode {
  hash: number
  keyId: string
}

export class ConsistentHash {
  private ring: RingNode[] = []
  private keys: Map<string, KeyState> = new Map()
  private replicas: number

  constructor(keys: { id: string; key: string }[], replicas = 100) {
    this.replicas = replicas
    for (const { id, key } of keys) {
      this.keys.set(id, {
        id,
        key,
        healthy: true,
        cooldownUntil: 0,
        errorCount: 0,
        requestCount: 0,
      })
      for (let i = 0; i < replicas; i++) {
        const hash = this.hash(`${id}:${i}`)
        this.ring.push({ hash, keyId: id })
      }
    }
    this.ring.sort((a, b) => a.hash - b.hash)
  }

  hash(str: string): number {
    let h = 0
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) | 0
    }
    return h >>> 0
  }

  getRoute(model: string, prefix: string): string | null {
    const h = this.hash(`${model}:${prefix}`)
    return this.findNearestNode(h)
  }

  getFailoverKey(failedKeyId: string, model: string, prefix: string): string | null {
    const h = this.hash(`${model}:${prefix}`)
    return this.findNearestNode(h, failedKeyId)
  }

  getRandomHealthyKey(): string {
    const healthyKeys = Array.from(this.keys.values()).filter(
      (k) => k.healthy && Date.now() > k.cooldownUntil
    )
    if (healthyKeys.length === 0) {
      const first = this.keys.keys().next().value
      return first ?? ''
    }
    return healthyKeys[Math.floor(Math.random() * healthyKeys.length)].id
  }

  markCooldown(keyId: string, seconds: number): void {
    const key = this.keys.get(keyId)
    if (!key) return
    key.healthy = false
    key.cooldownUntil = Date.now() + seconds * 1000
    key.errorCount++
  }

  incrementRequests(keyId: string): void {
    const key = this.keys.get(keyId)
    if (key) key.requestCount++
  }

  getKeyState(keyId: string): KeyState | undefined {
    return this.keys.get(keyId)
  }

  getAllKeyStates(): Map<string, KeyState> {
    return this.keys
  }

  private findNearestNode(hash: number, excludeKeyId?: string): string | null {
    let left = 0
    let right = this.ring.length - 1

    while (left <= right) {
      const mid = Math.floor((left + right) / 2)
      if (this.ring[mid].hash < hash) {
        left = mid + 1
      } else {
        right = mid - 1
      }
    }

    const now = Date.now()
    const startIdx = left % this.ring.length
    for (let i = 0; i < this.ring.length; i++) {
      const idx = (startIdx + i) % this.ring.length
      const node = this.ring[idx]
      const keyState = this.keys.get(node.keyId)

      if (node.keyId !== excludeKeyId && keyState) {
        if (now > keyState.cooldownUntil) {
          keyState.healthy = true
        }
        if (keyState.healthy) {
          return node.keyId
        }
      }
    }

    return null
  }
}