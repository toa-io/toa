import type { Context, Entity } from './types'

export async function effect ({ authority, identity }: Input, context: Context): Promise<Output | null> {
  const object = await context.local.observe({ query: { id: identity } })

  if (object === null || object instanceof Error || object.authority !== authority)
    return null

  return { username: object.username }
}

interface Input {
  authority: string
  identity: string
}

interface Output {
  username: Entity['username']
}
