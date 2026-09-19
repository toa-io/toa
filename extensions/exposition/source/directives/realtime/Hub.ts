import { console } from 'openspan'
import { Stream, HEARTBEAT, decode, encode, type Entry } from './Stream.ts'
import { MAXLEN, Shards, expire, prefix, shard } from '../../realtime/redis.ts'
import * as measure from './measurements.ts'
import type { Redis } from 'ioredis'

/**
 * The streams this gateway serves, by key.
 *
 * A key that has a reader here is subscribed to on its channel, and its stream in Redis is kept
 * alive: a component writes a routed event only to a stream that exists, so a stream that expired
 * under a reader would stop receiving. After its last reader leaves, the stream lives `expire`
 * more seconds — the window that reader reconnects in with its token.
 *
 * A channel keeps nothing for a subscriber that was away. Whenever the subscriber is back, what
 * each key was written meanwhile is read from its stream, from the last event this gateway
 * delivered of it; each reader skips what it was given already.
 */
export class Hub {
  private readonly keys = new Map<string, Key>()
  private shards: Shards | null = null

  // a subscribing connection can do nothing else, so each Redis has one of its own
  private subscribers: Shards | null = null
  private connecting: Promise<void> | null = null
  private prefix = ''

  /** Connects on the first stream it serves, not before: a gateway may serve none. */
  public async connect(): Promise<void> {
    this.connecting ??= this.start()

    await this.connecting
  }

  public close(): void {
    for (const { streams, timer } of this.keys.values()) {
      clearInterval(timer)

      for (const stream of streams) stream.close()
    }

    this.keys.clear()
    this.subscribers?.disconnect()
    this.shards?.disconnect()
    this.subscribers = null
    this.shards = null
    this.connecting = null
  }

  private async start(): Promise<void> {
    this.prefix = prefix()

    const shards = new Shards()
    const subscribers = new Shards()

    for (const connection of [...shards.connections, ...subscribers.connections])
      connection.on('error', (error: NodeJS.ErrnoException) =>
        console.debug('Realtime streams unreachable', {
          error: error.code ?? error.message
        })
      )

    subscribers.connections.forEach((subscriber, i) => {
      // a key's channel is subscribed to by the key, the prefix applying to it; what arrives is
      // named in full
      subscriber.on('smessage', (channel: string, message: string) =>
        this.receive(channel.slice(this.prefix.length), message)
      )

      // `ready` follows every reconnect too, and what was written meanwhile never arrives
      let connected = false

      subscriber.on('ready', () => {
        if (connected) void this.recover(i)

        connected = true
      })
    })

    this.shards = shards
    this.subscribers = subscribers

    await Promise.all([shards.connect(), subscribers.connect()])
  }

  public async open(key: string, token?: string): Promise<Stream> {
    await this.connect()

    const stream = new Stream()
    const entry = await this.enter(key, stream)

    stream.once('close', () => this.leave(key, stream))

    // welcome: a reader knows it is connected before anything is written
    setTimeout(() => stream.heartbeat(), 1000).unref()

    // written after the subscription, so nothing written after it misses this reader, and on
    // every connection: a stream that expired while its reader was away is created again, or
    // nothing would be written to it
    const marker = await this.marker(key)

    entry.last ??= marker

    const cursor = token === undefined ? marker : decode(token)
    const entries = token === undefined ? [] : await this.read(key, cursor)

    stream.cursor = cursor
    stream.ready(entries)

    // nothing was written since: the reader goes on from here
    if (entries.length === 0) stream.token(encode(marker))

    return stream
  }

  private async enter(key: string, stream: Stream): Promise<Key> {
    let entry = this.keys.get(key)

    if (entry === undefined) {
      entry = {
        streams: new Set(),
        last: null,
        timer: setInterval(() => this.renew(key), this.renewal()),
        subscribed: this.subscriber(key)
          .ssubscribe(key)
          .then(() => undefined)
      }

      entry.timer.unref()
      this.keys.set(key, entry)
    }

    entry.streams.add(stream)

    // the first reader subscribes, and every reader waits for it: nothing is read or written
    // for this one before the channel carries the key
    await entry.subscribed

    return entry
  }

  private leave(key: string, stream: Stream): void {
    const entry = this.keys.get(key)

    if (entry === undefined) return

    entry.streams.delete(stream)

    if (entry.streams.size > 0) return

    clearInterval(entry.timer)
    this.keys.delete(key)
    this.renew(key)

    this.subscriber(key)
      .sunsubscribe(key)
      .catch((error: Error) =>
        console.debug('Realtime key not unsubscribed', { key, error })
      )
  }

  /** Creates the stream where it is gone, and answers where it ends now. */
  private async marker(key: string): Promise<string> {
    const [[error, id]] = (await this.redis(key)
      .multi()
      .xadd(key, 'MAXLEN', '~', MAXLEN, '*', 'type', 'connect')
      .expire(key, this.expire())
      .exec())!

    if (error !== null) throw error

    return id as string
  }

  private async read(key: string, after: string): Promise<Entry[]> {
    const results = await this.redis(key).xread('STREAMS', key, after)
    const entries: Entry[] = []

    for (const [id, fields] of records(results)) {
      const [, event, , data] = fields

      // the marker a reader wrote is a position, not an event
      if (event === 'connect') continue

      entries.push({ id, event, data: data === undefined ? undefined : JSON.parse(data) })
    }

    return entries
  }

  private receive(key: string, message: string): void {
    const entry = this.keys.get(key)

    if (entry === undefined) return

    const [id, event, data] = JSON.parse(message) as [string, string, string]

    this.broadcast(entry, { id, event, data: JSON.parse(data) })
  }

  private broadcast(entry: Key, event: Entry): void {
    entry.last = event.id

    for (const stream of entry.streams) stream.deliver(event)

    measure.deliver(event.event)
  }

  /**
   * What every key was written while the subscriber was away. Its channels are subscribed to
   * again first, where the client has not done it on its own, so nothing written after the read
   * is missed.
   */
  private async recover(i: number): Promise<void> {
    const n = this.shards?.connections.length ?? 1
    const keys = [...this.keys.keys()].filter((key) => shard(key, n) === i)

    if (keys.length > 0)
      await this.subscribers?.connections[i].ssubscribe(...keys).catch((error: Error) => {
        console.warn('Realtime keys not subscribed again', { error })
      })

    for (const key of keys) {
      const entry = this.keys.get(key)

      // its last reader left meanwhile
      if (entry === undefined) continue

      try {
        const after = entry.last ?? '0'

        for (const event of await this.read(key, after)) this.broadcast(entry, event)
      } catch (error) {
        console.warn('Realtime key not recovered', { key, error })
      }
    }
  }

  /** The connection a key's stream is kept on. */
  private redis(key: string): Redis {
    return this.shards!.of(key)
  }

  private subscriber(key: string): Redis {
    return this.subscribers!.of(key)
  }

  private expire(): number {
    return expire()
  }

  /** Well within the expiry, and no more often than the heartbeat where that is. */
  private renewal(): number {
    return Math.min(HEARTBEAT, (this.expire() * 1000) / 3)
  }

  private renew(key: string): void {
    this.shards
      ?.of(key)
      .expire(key, this.expire())
      .catch((error: Error) => {
        // the next renewal tries again, well within the expiry
        console.debug('Realtime key not renewed', { key, error })
      })
  }
}

/**
 * The entries `XREAD` answers for one stream: an array of `[stream, entries]` pairs over RESP2,
 * an object keyed by stream over RESP3, and nothing where nothing was written since.
 */
function records(results: unknown): Array<[string, string[]]> {
  if (Array.isArray(results))
    return results.length === 0
      ? []
      : (results[0] as [string, Array<[string, string[]]>])[1]

  if (typeof results === 'object' && results !== null)
    return Object.values(results as Record<string, Array<[string, string[]]>>)[0] ?? []

  return []
}

interface Key {
  streams: Set<Stream>
  /** the last event of the key delivered here */
  last: string | null
  timer: NodeJS.Timeout
  subscribed: Promise<void>
}
