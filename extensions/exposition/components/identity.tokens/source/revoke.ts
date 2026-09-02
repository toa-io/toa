import type { Entity } from './lib/index.js'

export function transition (_: unknown, object: Entity): void {
  object.revokedAt = Date.now()
}
