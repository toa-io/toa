import type { Context, Entity } from '../types/index.js'

export async function effect ({ authority, identity }: Input, context: Context): Promise<Entity | null> {
  const object = await context.local.observe({ query: { id: identity } })

  if (object === null || object instanceof Error || object.authority !== authority)
    return null

  return await context.local.terminate({ query: { id: identity } })
}

interface Input {
  authority: string
  identity: string
}
