import type { Entity } from './lib'

export function transition (_: unknown, object: Entity): void {
  object.revokedAt = Date.now()
}
