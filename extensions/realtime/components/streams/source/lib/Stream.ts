import { PassThrough, Readable } from 'node:stream'

export class Stream extends Readable {
  private forks: number = 0
  private interval: NodeJS.Timeout | null = null
  private readonly logs: any

  public constructor (logs: any) {
    super(objectMode)

    this.once('resume', () => this.heartbeat())
    this.logs = logs
  }

  public fork (): PassThrough {
    const through = new PassThrough(objectMode)

    through.once('close', this.decrement.bind(this))

    this.increment()
    this.pipe(through)

    return through
  }

  // has to be here
  public override _read (): void {
  }

  public override _destroy (error: Error | null, callback: (error?: (Error | null)) => void): void {
    if (this.interval !== null)
      clearInterval(this.interval)

    super._destroy(error, callback)
  }

  private heartbeat (): void {
    if (this.interval === null)
      this.interval = setInterval(() => {
        this.push('heartbeat')
      }, HEARTBEAT_INTERVAL)
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

const HEARTBEAT_INTERVAL = 16_000
const objectMode = { objectMode: true }
