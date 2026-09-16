import { type Readable } from 'node:stream'
import { type Operation } from '@toa.io/bridges.node'
import type { Context } from '../types/index.d.ts'
import { Stream, Stash } from './lib/index.ts'

/**
 * A stream is opened per call, and a key has as many of them as it has consumers: one stream read
 * by several would hand each of its values to one of them only, and a consumer leaving would
 * destroy it under the others. What arrives under a key is pushed to every stream of it; what
 * belongs to a connection — the welcome, the token, the events missed since a token — to that
 * connection's stream alone.
 */
export class Effect implements Operation {
  private readonly streams = new Map<string, Set<Stream>>()
  private stash!: Stash
  private logs: any

  public mount(context: Context): void {
    context.state.streams = this.streams
    context.state.stash = new Stash(context.stash, context.configuration, context.logs)

    this.logs = context.logs
    this.stash = context.state.stash
  }

  public unmount(): void {
    const streams = [...this.streams.values()].flatMap((set) => [...set])

    this.logs.info('Destroying streams', { count: streams.length })

    // closed, not destroyed: destroying a stream that is still piped to a response
    // makes end-of-stream report a premature close, which reaches no one and takes
    // the process down.
    for (const stream of streams) stream.close()
  }

  public async execute(input: Input): Promise<Readable> {
    const key = input.key
    const stream = this.createStream(key)

    // welcome
    setTimeout(() => stream.heartbeat(), 1000)

    if (input.token === undefined)
      void this.stash.connect(key).then((token) => {
        if (token instanceof Error)
          this.logs.error('Failed to connect to stash', { key, error: token })
        else stream.push({ event: 'token', data: token })
      })
    else
      void this.stash.pop(key, input.token).then((result) => {
        if (result === null) return

        if ('code' in result && result.code === 'NO_RESULTS') return

        if (result instanceof Error) {
          this.logs.error('Failed to pop from stash', { key, error: result })

          return
        }

        if (stream.destroyed) return

        const [token, events] = result

        for (const event of events as Event[])
          stream.push({ event: event.event, data: event.data })

        stream.push({ event: 'token', data: token })
      })

    return stream
  }

  private createStream(key: string): Stream {
    const stream = new Stream()
    let set = this.streams.get(key)

    if (set === undefined) {
      set = new Set()
      this.streams.set(key, set)
    }

    set.add(stream)
    this.logs.debug('Stream created', { key, count: set.size })

    stream.events.once('destroy', () => {
      set.delete(stream)

      if (set.size === 0) this.streams.delete(key)

      this.logs.debug('Stream destroyed', { key, count: set.size })
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
