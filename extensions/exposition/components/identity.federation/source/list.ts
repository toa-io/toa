import type { Context, Entity } from './types'

export async function computation ({ authority, identity }: Input, context: Context): Promise<Entity[]> {
  const objects = await context.local.enumerate({
    query: {
      criteria: `authority==${authority};identity==${identity}`,
      projection: ['iss'],
      sort: ['_created:desc']
    }
  })

  const legacy = await context.local.observe({ query: { id: identity } })

  if (legacy !== null && legacy.authority === authority && legacy.identity === undefined)
    objects.push(legacy)

  return objects.sort((a, b) => b._created - a._created)
}

interface Input {
  authority: string
  identity: string
}
