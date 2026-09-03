import { quote } from '@toa.io/generic'
import { MAX_KEYS } from './lib/const.js'
import type { Context, Passkey } from './types/index.js'

export async function computation ({ authority, identity }: Input, context: Context): Promise<Passkey[]> {
  return await context.local.enumerate({
    query: {
      criteria: `authority==${quote(authority)};identity==${quote(identity)}`,
      projection: ['aid', 'synced', 'label'],
      limit: MAX_KEYS
    }
  })
}

interface Input {
  authority: string
  identity: string
}
