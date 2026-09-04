import type { AddInput, Context, TransitOutput } from '../types/index.js'
import type { Maybe } from '@toa.io/core'

export async function effect (input: AddInput, context: Context): Promise<Maybe<TransitOutput>> {
  return await context.local.transit({
    input: {
      authority: input.authority,
      username: input.username,
      password: input.password,
      inception: true
    },
    // `delete` leaves a tombstone, which the transition revives
    query: { id: input.id, deleted: true }
  })
}
