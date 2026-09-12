import type { Context, Entity } from '../types/index.d.ts'

/**
 * A computation: it reads the record and answers what of it may be shown. Reached by a `GET`, which
 * may only read, so what it is matters — see `documentation/safety.md`.
 */
export async function computation(
  { authority, identity }: Input,
  context: Context
): Promise<Output | null> {
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
