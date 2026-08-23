import type { Context, Entity } from './types'

export async function computation ({ authority, identity }: Input, context: Context): Promise<Entity[]> {
  return await context.local.enumerate({
    query: {
      criteria: `authority==${authority};identity==${identity}`,
      projection: ['iss'],
      sort: ['_created:desc'],
      limit: 100
    }
  })
}

interface Input {
  authority: string
  identity: string
}
