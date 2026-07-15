import { EventEmitter, Readable } from 'node:stream'

export class Stream extends Readable {
  public events = new EventEmitter()

  private interval: NodeJS.Timeout | null = null

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

  public heartbeat (stream: Readable = this): boolean {
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
