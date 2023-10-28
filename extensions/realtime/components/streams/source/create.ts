import { type Readable } from 'node:stream'
import { type Operation } from '@toa.io/types'
import { type Context } from './types'
import { Stream } from './lib/stream'

export class Effect implements Operation {
  private readonly streams = new Map<string, Stream>()

  public mount (context: Context): void {
    context.state.streams = this.streams
  }

  public async execute (input: Input, context: Context): Promise<Readable> {
    const key = input.key

    if (!this.streams.has(key))
      this.createStream(key)

    return (this.streams.get(key) as Stream).fork()
  }

  private createStream (key: string): void {
    const stream = new Stream()

    this.streams.set(key, stream)

    stream.once('close', () => this.streams.delete(key))
  }
}

interface Input {
  key: string
}
