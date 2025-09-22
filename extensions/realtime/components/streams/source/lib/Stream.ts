import { PassThrough, Readable } from 'node:stream'

export class Stream extends Readable {
  private forks: number = 0
  private interval: NodeJS.Timeout | null = null
  private readonly logs: any

  public constructor (logs: any) {
    super(objectMode)

    this.logs = logs
  }

  public fork (): PassThrough {
    const through = new PassThrough(objectMode)

    through.once('close', this.decrement.bind(this))

    this.increment()
    this.heartbeat(through)
    this.pipe(through)

    return through
  }

  // has to be here
  public override _read (): void {
    if (this.interval === null)
      this.interval = setInterval(() => this.heartbeat(), HEARTBEAT_INTERVAL)
  }

  public override _destroy (error: Error | null, callback: (error?: (Error | null)) => void): void {
    if (this.interval !== null)
      clearInterval(this.interval)

    this.logs.debug('Stream destroyed', { forks: this.forks })

    super._destroy(error, callback)
  }

  private heartbeat (stream: Readable = this): boolean {
    const resume = stream.push('heartbeat ' + Date.now())

    if (!resume && this.interval !== null) {
      clearInterval(this.interval)
      this.interval = null
    }

    return resume
  }

  private increment (): void {
    this.forks++

    this.logs.debug('Stream forked', { forks: this.forks })
  }

  private decrement (): void {
    this.forks--

    this.logs.debug('Stream fork closed', { forks: this.forks })

    if (this.forks === 0)
      this.destroy()
  }
}

const HEARTBEAT_INTERVAL = 16_000 // why?
const objectMode = { objectMode: true }
