import type { Entity } from './lib/Entity'

export async function transition (input: Input, object: Entity): Promise<Entity | Error> {
  if (input.grantor === undefined)
    return Object.assign(object, input)

  if (!within('system:identity:roles', input.grantor.roles) &&
    !within(input.role, input.grantor.roles))
    return ERR_INACCESSIBLE_SCOPE

  object.role = input.role
  object.identity = input.identity
  object.grantor = input.grantor.id

  return object
}

function within (role: string, scopes: string[]): boolean {
  return scopes.some((scope) => role === scope || role.startsWith(scope + ':'))
}

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
