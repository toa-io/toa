import { type Context, type PushInput } from './lib/types'

export async function effect ({ key, event, data }: PushInput, context: Context): Promise<void> {
  context.state.streams.get(key)?.push({ event, data })

  void context.state.stash.push(key, event, data).then((token) => {
    if (token instanceof Error)
      context.logs.error('Failed to push to stash', { key, error: token })
    else
      context.state.streams.get(key)?.push({ event: 'token', data: token })
  })
}
