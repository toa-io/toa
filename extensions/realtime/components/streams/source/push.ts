import { type Context, type PushInput } from './lib/types'

export async function effect ({ key, event, data }: PushInput, context: Context): Promise<void> {
  context.state.streams.get(key)?.push({ event, data })
}
