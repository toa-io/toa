import { quote } from '@toa.io/generic'
import type { Context } from './types/index.js'

export async function effect ({ authority, identity, id }: Input, context: Context): Promise<void | null> {
  return await context.local.terminate({
    query: {
      criteria: `authority==${quote(authority)};identity==${quote(identity)};id==${quote(id)}`
    }
  })
}

interface Input {
  authority: string
  identity: string
  id: string
}
