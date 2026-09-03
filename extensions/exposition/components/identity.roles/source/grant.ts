import type { Entity } from './lib/Entity.js'

export async function transition (input: Input, object: Entity): Promise<Entity | Error> {
  if (input.grantor === undefined)
    return Object.assign(object, input)

  // a manager grants any role; a delegate grants within its own scopes, and never the
  // right to grant
  if (!within(MANAGEMENT, input.grantor.roles) &&
    (!within(input.role, input.grantor.roles) || within(input.role, [MANAGEMENT])))
    return ERR_INACCESSIBLE_SCOPE

  object.role = input.role
  object.identity = input.identity
  object.grantor = input.grantor.id

  return object
}

function within (role: string, scopes: string[]): boolean {
  return scopes.some((scope) => role === scope || role.startsWith(scope + ':'))
}

const MANAGEMENT = 'system:identity:roles'

const ERR_INACCESSIBLE_SCOPE = new (class InaccessibleScopeError extends Error {
  public readonly code = 'INACCESSIBLE_SCOPE'
})()

export interface Input {
  identity: string
  role: string
  grantor?: {
    id: string
    roles: string[]
  }
}
