import { quote } from '@toa.io/generic'
import type { Entity } from './lib/Entity.js'
import type { Call, Query } from '@toa.io/core'
import type { Input as GrantInput } from './grant.js'

const SYSTEM = 'system'

/**
 * The Role is asked for more than once: inception grants it before the reply that mints its
 * token, and the event fires again on every later change to those credentials.
 */
export async function effect (input: Identity, context: Context): Promise<void> {
  if (await granted(input.id, context))
    return

  try {
    await context.local.grant({
      input: {
        identity: input.id,
        role: SYSTEM
      }
    })
  } catch (error) {
    // two inceptions of the same credentials race, and the unique index refuses the second
    if (!await granted(input.id, context))
      throw error
  }
}

async function granted (identity: string, context: Context): Promise<boolean> {
  const roles = await context.local.list({
    query: {
      criteria: `identity==${quote(identity)};role==${quote(SYSTEM)}`,
      limit: 1
    }
  })

  return roles.length > 0
}

interface Identity {
  id: string
}

export interface Context {
  local: {
    grant: Call<Entity, GrantInput>
    list: (request: { query: Query }) => Promise<string[]>
  }
}
