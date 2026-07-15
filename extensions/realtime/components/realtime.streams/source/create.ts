import { type Readable } from 'node:stream'
import { type Operation } from '@toa.io/types'
import { type Context } from './lib/types'
import { Stream, Stash } from './lib'

export class Effect implements Operation {
  private readonly streams = new Map<string, Stream>()
  private stash!: Stash
  private logs: any

  public mount (context: Context): void {
    context.state.streams = this.streams
    context.state.stash = new Stash(context.stash, context.configuration, context.logs)

    this.logs = context.logs
    this.stash = context.state.stash
  }

  public unmount (): void {
    this.logs.info('Destroying streams', { count: this.streams.size })

    for (const stream of this.streams.values())
      stream.destroy()
  }

  public async execute (input: Input): Promise<Readable> {
    const key = input.key

    if (!this.streams.has(key)) {
      const stream = this.createStream(key)

      this.streams.set(key, stream)
      this.logs.debug('Stream created', { key })
    }

    // welcome
    setTimeout(() => this.streams.get(key)?.heartbeat(), 1000)

    if (input.token === undefined)
      void this.stash.connect(key).then((token) => {
        if (token instanceof Error)
          this.logs.error('Failed to connect to stash', { key, error: token })
        else
          this.streams.get(key)?.push({ event: 'token', data: token })
      })
    else
      void this.stash.pop(key, input.token).then((result) => {
        if (result === null) return

        if ('code' in result && result.code === 'NO_RESULTS') return

        if (result instanceof Error) {
          this.logs.error('Failed to pop from stash', { key, error: result })

          return
        }

        const stream = this.streams.get(key)

        if (stream === undefined)
          return

        const [token, events] = result

        for (const event of events as Event[])
          stream.push({ event: event.event, data: event.data })

        stream.push({ event: 'token', data: token })
      })

    return this.streams.get(key)!
  }

  private createStream (key: string): Stream {
    const stream = new Stream()

    stream.events.once('destroy', () => {
      this.logs.debug('Stream destroyed', { key })
      this.streams.delete(key)
    })

    return stream
  }
}

interface Input {
  key: string
  token?: string
}

interface Event {
  event: string
  data: unknown
}
