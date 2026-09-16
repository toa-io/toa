import type { Context, PushInput } from '../types/index.d.ts'

export async function effect(
  { key, event, data }: PushInput,
  context: Context
): Promise<void> {
  broadcast(context, key, { event, data })

  void context.state.stash.push(key, event, data).then((token) => {
    if (token instanceof Error)
      context.logs.error('Failed to push to stash', { key, error: token })
    else broadcast(context, key, { event: 'token', data: token })
  })
}

/** To every stream the key has: each is a consumer of its own. */
function broadcast(context: Context, key: string, message: object): void {
  const streams = context.state.streams.get(key)

  if (streams === undefined) return

  for (const stream of streams) stream.push(message)
}
