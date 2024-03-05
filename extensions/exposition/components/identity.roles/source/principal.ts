import type { Entity } from './lib/Entity'
import type { Call } from '@toa.io/types'
import type { Input as GrantInput } from './grant'

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
