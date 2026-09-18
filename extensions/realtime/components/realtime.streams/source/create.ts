import { type Readable } from 'node:stream'
import { type Operation } from '@toa.io/bridges.node'
import type { Context } from '../types/index.d.ts'
import { environment } from '@toa.io/generic'
import { Stream, Stash, Routes, type Declaration } from './lib/index.ts'
import type { Route } from '@toa.io/definitions/extensions.realtime'

/**
 * A stream is opened per call, and a key has as many of them as it has consumers: one stream read
 * by several would hand each of its values to one of them only, and a consumer leaving would
 * destroy it under the others. What arrives under a key is pushed to every stream of it; what
 * belongs to a connection — the welcome, the token, the events missed since a token — to that
 * connection's stream alone.
 */
export class Effect implements Operation {
  private readonly streams = new Map<string, Set<Stream>>()
  // the routes to a key are renewed while it has consumers, a timer per key
  private readonly renewals = new Map<string, NodeJS.Timeout>()
  private stash!: Stash
  private routes!: Routes
  private expire = 0
  private logs: any

  public async mount(context: Context): Promise<void> {
    context.state.streams = this.streams
    context.state.stash = new Stash(context.stash, context.configuration, context.logs)
    context.state.routes = new Routes(context, declarations())

    this.logs = context.logs
    this.stash = context.state.stash
    this.routes = context.state.routes
    this.expire = context.configuration.expire * 1000

    await this.routes.open()
  }

  public unmount(): void {
    for (const timer of this.renewals.values()) clearInterval(timer)

    this.renewals.clear()
    this.routes.close()

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
      this.consumed(key)
    }

    set.add(stream)
    this.logs.debug('Stream created', { key, count: set.size })

    stream.events.once('destroy', () => {
      set.delete(stream)

      if (set.size === 0) {
        this.streams.delete(key)
        this.abandoned(key)
      }

      this.logs.debug('Stream destroyed', { key, count: set.size })
    })

    return stream
  }

  /** The key has a consumer: its routes live on while it does. */
  private consumed(key: string): void {
    this.renew(key)
    this.renewals.set(
      key,
      setInterval(() => this.renew(key), this.expire / 3)
    )
  }

  /** The last consumer left: the routes live `expire` from now, the window it reconnects in. */
  private abandoned(key: string): void {
    clearInterval(this.renewals.get(key))
    this.renewals.delete(key)
    this.renew(key)
  }

  private renew(key: string): void {
    this.routes.renew(key).catch((error: unknown) => {
      // the next renewal tries again, well within the expiry
      this.logs.warn('Routes not renewed', { key, error })
    })
  }
}

/** The events declared dynamic, and what their routes may expose. */
function declarations(): Map<string, Declaration> {
  const value = environment.get('TOA_REALTIME')
  const routes = value === undefined ? [] : (JSON.parse(value) as Route[])
  const map = new Map<string, Declaration>()

  for (const { event, dynamic } of routes)
    if (dynamic !== undefined) map.set(event, dynamic)

  return map
}

interface Input {
  key: string
  token?: string
}

interface Event {
  event: string
  data: unknown
}
