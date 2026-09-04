import type { Entity } from './lib/Entity.js'
import type { Call } from '@toa.io/core'
import type { Input as GrantInput } from './grant.js'

export async function effect (input: Identity, context: Context): Promise<void> {
  await context.local.grant({
    input: {
      identity: input.id,
      role: 'system'
    }
  })
}

interface Identity {
  id: string
}

export interface Context {
  local: {
    grant: Call<Entity, GrantInput>
  }
}
