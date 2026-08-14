import { resolve } from './lib'
import { effect as create } from './create'
import type { Context, Scheme } from './types'

export async function effect (input: Input, context: Context): Promise<Output | Error> {
  if (input.id !== undefined) {
    const credential = await create({ ...input, id: input.id }, context)

    return credential instanceof Error ? credential : { id: input.id }
  }

  const claims = await resolve(input.scheme, input.credentials, context)

  if (claims instanceof Error)
    return claims

  const { iss, sub } = claims

  // without a prescribed id, the new credential's id becomes the Identity id
  const entity = await context.local.transit({
    input: { authority: input.authority, iss, sub }
  })

  return { id: entity.id }
}

export interface Input {
  authority: string
  scheme: Scheme
  credentials: string
  id?: string
}

export interface Output {
  id: string
}
