import type { Entity } from './lib'

export function transition (_: never, object: Entity): void {
  object.revokedAt = Date.now()
}
