import { type Readable } from 'node:stream'
import assert from 'node:assert'
import { type Operation } from '@toa.io/types'
import { type Context } from './lib/types'
import { Stream } from './lib/Stream'

export class Effect implements Operation {
  private readonly streams = new Map<string, Stream>()
  private logs: any

  public mount (context: Context): void {
    context.state.streams = this.streams
    this.logs = context.logs
  }

  public unmount (): void {
    this.logs.info('Destroying streams', { count: this.streams.size })

    for (const stream of this.streams.values())
      stream.destroy()
  }

  public async execute (input: Input): Promise<Readable> {
    const key = input.key

    if (!this.streams.has(key))
      this.createStream(key)

    const stream = this.streams.get(key)

    assert.ok(stream !== undefined)

    return stream.fork()
  }

  private createStream (key: string): void {
    const stream = new Stream()

    this.streams.set(key, stream)

    stream.once('close', () => {
      this.logs.debug('Stream closed', { key })
      this.streams.delete(key)
    })

    this.logs.debug('Stream created', { key })
  }
}

interface Input {
  key: string
}
