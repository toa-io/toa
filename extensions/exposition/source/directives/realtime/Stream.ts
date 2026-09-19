import { Readable } from 'node:stream'

/**
 * One reader of a key: what it is sent, in order, and a heartbeat while nothing is.
 *
 * `cursor` is the id of the last event it was given. What arrives while it is being replayed to
 * is held until the replay is done, and whatever it was given already is not given again: a replay
 * and the channel may both carry the same event.
 */
export class Stream extends Readable {
  public cursor: string | null = null

  private held: Entry[] | null = []
  private interval: NodeJS.Timeout | null = null
  private ended = false

  public constructor() {
    super({ objectMode: true })
  }

  // a stream is read from when the reply is written, and the heartbeat starts with the reading
  public override _read(): void {
    this.interval ??= setInterval(() => this.heartbeat(), HEARTBEAT)
  }

  public override _destroy(
    error: Error | null,
    callback: (error?: Error | null) => void
  ): void {
    this.stop()
    callback(error)
  }

  /** An event of the key, or one held back while the replay is in flight. */
  public deliver(entry: Entry): void {
    if (this.held !== null) {
      this.held.push(entry)

      return
    }

    this.write(entry)
  }

  /** What the replay found is sent, then what was held back meanwhile, and from now on as it comes. */
  public ready(entries: Entry[]): void {
    const held = this.held ?? []

    this.held = null

    for (const entry of entries) this.write(entry)
    for (const entry of held) this.write(entry)
  }

  public token(token: string): void {
    this.send({ event: 'token', data: token })
  }

  public heartbeat(): void {
    this.send('heartbeat ' + Date.now())
  }

  /** Ends it: whoever reads it gets the end, not a broken pipe. */
  public close(): void {
    this.stop()
    this.ended = true
    this.push(null)
  }

  private write(entry: Entry): void {
    if (this.cursor !== null && compare(entry.id, this.cursor) <= 0) return

    this.cursor = entry.id
    this.send({ event: entry.event, data: entry.data })
    this.token(encode(entry.id))
  }

  private send(message: unknown): void {
    if (this.ended || this.destroyed) return

    this.push(message)
  }

  private stop(): void {
    if (this.interval !== null) clearInterval(this.interval)

    this.interval = null
  }
}

export interface Entry {
  id: string
  event: string
  data: unknown
}

export function encode(id: string): string {
  return Buffer.from(id).toString('base64url')
}

export function decode(token: string): string {
  return Buffer.from(token, 'base64url').toString()
}

/** Stream ids are `<ms>-<seq>`, ordered as two numbers. */
export function compare(a: string, b: string): number {
  const [ams, aseq] = a.split('-').map(BigInt)
  const [bms, bseq] = b.split('-').map(BigInt)

  if (ams !== bms) return ams < bms ? -1 : 1
  if (aseq !== bseq) return aseq < bseq ? -1 : 1

  return 0
}

export const HEARTBEAT = 16_000
