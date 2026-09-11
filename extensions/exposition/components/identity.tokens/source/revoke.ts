import type { Entity } from './lib/index.ts'

export function transition(_: unknown, object: Entity): void {
  object.revokedAt = Date.now()
}
