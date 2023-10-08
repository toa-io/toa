import { PassThrough, type Readable } from 'node:stream'
import { type Context } from './types'
import { Stream } from './lib/streams'

export async function effect (key: string, context: Context): Promise<Readable> {
  if (context.state[key] === undefined)
    context.state[key] = new Stream()

  return new PassThrough()
    .pipe(context.state[key])
}
