import type { Entity } from './lib/Entity.ts'

export async function transition(input: Input, entry: Entity): Promise<Entity | Error> {
  if (input.grantor === undefined) return Object.assign(entry, input)

  // a manager grants any role; a delegate grants within its own scopes, and never the
  // right to grant
  if (
    !within(MANAGEMENT, input.grantor.roles) &&
    (!within(input.role, input.grantor.roles) || within(input.role, [MANAGEMENT]))
  )
    return ERR_INACCESSIBLE_SCOPE

  entry.role = input.role
  entry.identity = input.identity
  entry.grantor = input.grantor.id

  return entry
}

function within(role: string, scopes: string[]): boolean {
  return scopes.some((scope) => role === scope || role.startsWith(scope + ':'))
}

const MANAGEMENT = 'system:identity:roles'

const ERR_INACCESSIBLE_SCOPE = new Error('INACCESSIBLE_SCOPE')

export interface Input {
  identity: string
  role: string
  grantor?: {
    id: string
    roles: string[]
  }
}
