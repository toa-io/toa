import type { Entity } from './lib/index.ts'

export function transition(_: unknown, entry: Entity): void {
  entry.revokedAt = Date.now()
}
