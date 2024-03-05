import { Err } from 'error-value'
import type { Entity } from './lib/Entity'

export async function transition (input: Input, object: Entity): Promise<Entity | Error> {
  if (input.delegator === undefined)
    return Object.assign(object, input)

  if (!allowed(input.role, input.delegator.roles))
    return ERR_OUT_OF_SCOPE

  object.role = input.role
  object.identity = input.identity
  object.delegator = input.delegator.id

  return object
}

function allowed (scope: string, roles: string[]): boolean {
  return roles.some((role) => scope.startsWith(role))
}

const ERR_OUT_OF_SCOPE = Err('OUT_OF_SCOPE')

export interface Input {
  identity: string
  role: string
  delegator?: {
    id: string
    roles: string[]
  }
}
