import type { Context } from './types'

export async function effect ({ authority, identity, id }: Input, context: Context): Promise<void | null> {
  const object = await context.local.observe({ query: { id } })

  if (object === null || object.authority !== authority || (object.identity ?? object.id) !== identity)
    return null

  return await context.local.terminate({ query: { id } })
}

interface Input {
  authority: string
  identity: string
  id: string
}
