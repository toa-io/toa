import type { AddInput, Context, IdOutput } from './types'
import type { Maybe } from '@toa.io/types'

export async function effect(input: AddInput, context: Context): Promise<Maybe<IdOutput>> {
  return await context.local.transit({ 
    input: {
      authority: input.authority,
      username: input.username,
      password: input.password,
      inception: true
    },
    query: { id: input.id }
  })
}
