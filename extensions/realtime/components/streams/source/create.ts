import { type Readable } from 'node:stream'
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

    let stream: Stream | undefined

    if (!this.streams.has(key)) {
      stream = this.createStream(key)

      this.logs.debug('Stream created', { key })
    } else
      stream = this.streams.get(key)!

    // welcome
    setTimeout(() => stream?.heartbeat(), 1000)

    return stream
  }

  private createStream (key: string): Stream {
    const stream = new Stream()

    this.streams.set(key, stream)

    stream.events.once('destroy', () => {
      this.logs.debug('Stream destroyed', { key })
      this.streams.delete(key)
    })

    return stream
  }
}

interface Input {
  key: string
}
