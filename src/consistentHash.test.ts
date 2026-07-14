import { describe, it, expect } from 'vitest'
import { ConsistentHash } from './consistentHash'

describe('ConsistentHash', () => {
  const keys = [
    { id: 'key_0', key: 'key-aaa' },
    { id: 'key_1', key: 'key-bbb' },
    { id: 'key_2', key: 'key-ccc' },
    { id: 'key_3', key: 'key-ddd' },
    { id: 'key_4', key: 'key-eee' },
  ]

  it('assigns a key for a given model+prefix', () => {
    const ring = new ConsistentHash(keys)
    const route = ring.getRoute('gpt-4', 'hello')
    expect(route).toBeDefined()
  })

  it('returns the same key for the same input (consistency)', () => {
    const ring = new ConsistentHash(keys)
    const first = ring.getRoute('gpt-4', 'hello world')
    const second = ring.getRoute('gpt-4', 'hello world')
    expect(first).toBe(second)
  })

  it('returns a deterministic key for the same input', () => {
    const ring = new ConsistentHash(keys)
    const a = ring.getRoute('model', 'prefix-a')
    const b = ring.getRoute('model', 'prefix-a')
    expect(a).toBe(b)
  })

  it('returns null when all keys are on cooldown', () => {
    const ring = new ConsistentHash(keys)
    ring.markCooldown('key_0', 365)
    ring.markCooldown('key_1', 365)
    ring.markCooldown('key_2', 365)
    ring.markCooldown('key_3', 365)
    ring.markCooldown('key_4', 365)
    expect(ring.getRoute('model', '')).toBeNull()
  })

  it('markCooldown sets healthy to false', () => {
    const ring = new ConsistentHash(keys)
    expect(ring.getKeyState('key_0')?.healthy).toBe(true)
    ring.markCooldown('key_0', 60)
    expect(ring.getKeyState('key_0')?.healthy).toBe(false)
    expect(ring.getKeyState('key_0')?.cooldownUntil).toBeGreaterThan(Date.now())
  })

  it('getFailoverKey returns a different healthy key', () => {
    const ring = new ConsistentHash(keys)
    const failed = ring.getRoute('model', 'some-long-prefix')
    expect(failed).toBeDefined()

    const failover = ring.getFailoverKey(failed!, 'model', 'some-long-prefix')
    expect(failover).toBeDefined()
    expect(failover).not.toBe(failed)
  })

  it('returns null when only one key exists and it is on cooldown', () => {
    const ring = new ConsistentHash([keys[0]])
    ring.markCooldown('key_0', 365)
    expect(ring.getRoute('model', '')).toBeNull()
    expect(ring.getFailoverKey('key_0', 'model', '')).toBeNull()
  })

  it('incrementRequests increases the counter', () => {
    const ring = new ConsistentHash(keys)
    expect(ring.getKeyState('key_0')?.requestCount).toBe(0)
    ring.incrementRequests('key_0')
    expect(ring.getKeyState('key_0')?.requestCount).toBe(1)
  })

  it('getAllKeyStates returns the keys map', () => {
    const ring = new ConsistentHash(keys)
    const all = ring.getAllKeyStates()
    expect(all.size).toBe(5)
    expect(all.has('key_0')).toBe(true)
  })
})
