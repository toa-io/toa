import { type Context, type PushInput } from './types'

export async function effect ({ key, event, data }: PushInput, context: Context): Promise<void> {
  if (context.state[key] !== undefined)
    context.state[key].push({ event, data })
}
