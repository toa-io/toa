import { EventEmitter } from 'node:events'
import { Readable } from 'node:stream'

export class Stream extends Readable {
  public events = new EventEmitter()

  private interval: NodeJS.Timeout | null = null
  private ended = false

  public constructor () {
    super(objectMode)
  }

  // has to be here
  public override _read (): void {
    if (this.interval === null)
      this.interval = setInterval(() => this.heartbeat(), HEARTBEAT_INTERVAL)
  }

  public override _destroy (error: Error | null, callback: (error?: (Error | null)) => void): void {
    if (this.interval !== null)
      clearInterval(this.interval)

    this.events.emit('destroy')

    super._destroy(error, callback)
  }

  /** Ends the stream: whoever reads it gets EOF rather than a broken pipe. */
  public close (): void {
    this.ended = true

    if (this.interval !== null) {
      clearInterval(this.interval)
      this.interval = null
    }

    this.push(null)
  }

  public heartbeat (stream: Readable = this): boolean {
    if (this.ended) return false

    const resume = stream.push('heartbeat ' + Date.now())

    if (!resume && this.interval !== null) {
      clearInterval(this.interval)
      this.interval = null
    }

    return resume
  }
}

const HEARTBEAT_INTERVAL = 16_000 // why?
const objectMode = { objectMode: true }
