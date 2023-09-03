import { type Entity } from './types'

export function transition (_: never, object: Entity): void {
  object.revokedAt = Date.now()
}
