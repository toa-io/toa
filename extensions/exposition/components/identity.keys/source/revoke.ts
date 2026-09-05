import { quote } from '@toa.io/generic'
import type { Call, Observation } from '@toa.io/core/types'

export async function effect ({ identity }: Input, context: Context): Promise<void> {
  const keys = await context.local.enumerate({
    query: {
      criteria: `identity==${quote(identity)}`,
      limit: LIMIT
    }
  })

  await Promise.all(keys.map(async ({ id }) => context.local.disable({ query: { id } })))
}

const LIMIT = 1024

interface Input {
  identity: string
}

interface Key {
  id: string
}

interface Context {
  local: {
    enumerate: Observation<Key[], never, Key>
    disable: Call<void>
  }
}
