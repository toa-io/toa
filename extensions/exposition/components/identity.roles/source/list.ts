import type { Entity } from './lib/Entity.ts'

export function observation(_: unknown, entries: Entity[]): string[] {
  return entries.map(({ role }) => role)
}
