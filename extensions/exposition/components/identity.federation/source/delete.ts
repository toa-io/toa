import type { Context } from './types'

export async function effect ({ authority, identity, credential }: Input, context: Context): Promise<void | null> {
  const object = await context.local.observe({ query: { id: credential } })

  if (object === null || object.authority !== authority || object.identity !== identity)
    return null

  return await context.local.terminate({ query: { id: credential } })
}

interface Input {
  authority: string
  identity: string
  credential: string
}
