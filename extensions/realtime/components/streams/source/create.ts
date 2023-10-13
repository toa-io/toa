import { type Readable } from 'node:stream'
import { type Context } from './types'
import { addStream } from './lib/streams'

export async function effect (input: Input, context: Context): Promise<Readable> {
  const key = input.key

  if (!(key in context.state))
    addStream(key, context.state)

  return context.state[key].fork()
}

interface Input {
  key: string
}
