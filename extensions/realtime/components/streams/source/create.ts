import { type Readable } from 'node:stream'
import { type Context } from './types'
import { addStream } from './lib/streams'

export async function effect (key: string, context: Context): Promise<Readable> {
  if (context.state[key] === undefined)
    addStream(key, context.state)

  return context.state[key].fork()
}
