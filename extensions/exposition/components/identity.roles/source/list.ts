import type { Entity } from './lib/Entity.js'

export function observation (_: unknown, objects: Entity[]): string[] {
  return objects.map(({ role }) => role)
}
