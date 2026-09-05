import { quote } from '@toa.io/generic'
import type { Context, Entity } from './types/index.js'

export async function computation ({ authority, identity }: Input, context: Context): Promise<Entity[]> {
  return await context.local.enumerate({
    query: {
      criteria: `authority==${quote(authority)};identity==${quote(identity)}`,
      projection: ['iss'],
      sort: ['CREATED:desc'],
      limit: 100
    }
  })
}

interface Input {
  authority: string
  identity: string
}
