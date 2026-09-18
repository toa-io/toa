import { console } from 'openspan'
import { connect, expire, prefix, MAXLEN } from '../../realtime/redis.ts'
import * as measure from '../../realtime/measurements.ts'
import { Stream, HEARTBEAT, decode, encode, type Entry } from './Stream.ts'
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
  private redis: Redis | null = null
  private subscriber: Redis | null = null
  private connecting: Promise<void> | null = null
  private prefix = ''

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

  public close(): void {
    for (const { streams, timer } of this.keys.values()) {
      clearInterval(timer)

      for (const stream of streams) stream.close()
    }

    this.keys.clear()
    this.subscriber?.disconnect()
    this.redis?.disconnect()
    this.subscriber = null
    this.redis = null
    this.connecting = null
  }

  private async connect(): Promise<void> {
    this.connecting ??= this.start()

    await this.connecting
  }

  private async start(): Promise<void> {
    this.prefix = prefix()

    const redis = connect({ keyPrefix: this.prefix })

    // a subscribing connection can do nothing else, and a channel name is not prefixed
    const subscriber = connect()

    for (const connection of [redis, subscriber])
      connection.on('error', (error: NodeJS.ErrnoException) =>
        console.debug('Realtime streams unreachable', {
          error: error.code ?? error.message
        })
      )

    subscriber.on('smessage', (channel: string, message: string) =>
      this.receive(channel.slice(this.prefix.length), message)
    )

    // `ready` follows every reconnect too, and what was written meanwhile never arrives
    let connected = false

    subscriber.on('ready', () => {
      if (connected) void this.recover()

      connected = true
    })

    this.redis = redis
    this.subscriber = subscriber

    await Promise.all([redis.connect(), subscriber.connect()])
  }

  private async enter(key: string, stream: Stream): Promise<Key> {
    let entry = this.keys.get(key)

    if (entry === undefined) {
      entry = {
        streams: new Set(),
        last: null,
        timer: setInterval(() => this.renew(key), renewal()),
        subscribed: this.subscriber!.ssubscribe(this.prefix + key).then(() => undefined)
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

    this.subscriber
      ?.sunsubscribe(this.prefix + key)
      .catch((error: Error) =>
        console.debug('Realtime key not unsubscribed', { key, error })
      )
  }

  /** Creates the stream where it is gone, and answers where it ends now. */
  private async marker(key: string): Promise<string> {
    const [[error, id]] = (await this.redis!.multi()
      .xadd(key, 'MAXLEN', '~', MAXLEN, '*', 'type', 'connect')
      .expire(key, expire())
      .exec())!

    if (error !== null) throw error

    return id as string
  }

  private async read(key: string, after: string): Promise<Entry[]> {
    const results = (await this.redis!.xread('STREAMS', key, after)) as Array<
      [string, Array<[string, string[]]>]
    > | null

    if (results === null || results.length === 0) return []

    const entries: Entry[] = []

    for (const [id, fields] of results[0][1]) {
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

  /** What every key was written while the subscriber was away. */
  private async recover(): Promise<void> {
    for (const [key, entry] of this.keys)
      try {
        const after = entry.last ?? '0'

        for (const event of await this.read(key, after)) this.broadcast(entry, event)
      } catch (error) {
        console.warn('Realtime key not recovered', { key, error })
      }
  }

  private renew(key: string): void {
    this.redis?.expire(key, expire()).catch((error: Error) => {
      // the next renewal tries again, well within the expiry
      console.debug('Realtime key not renewed', { key, error })
    })
  }
}

/** Well within the expiry, and no more often than the heartbeat where that is. */
function renewal(): number {
  return Math.min(HEARTBEAT, (expire() * 1000) / 3)
}

interface Key {
  streams: Set<Stream>
  /** the last event of the key delivered here */
  last: string | null
  timer: NodeJS.Timeout
  subscribed: Promise<void>
}
