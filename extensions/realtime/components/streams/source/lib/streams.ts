import { Duplex, PassThrough } from 'node:stream'

export function addStream (key: string, map: Record<string, Stream>): void {
  const stream = new Stream()

  map[key] = stream

  stream.once('close', () => delete map[key])
}

export class Stream extends Duplex {
  private forks: number = 0

  public constructor () {
    super(objectMode)
  }

  public fork (): PassThrough {
    const destination = new PassThrough(objectMode)

    destination.once('close', this.decrement.bind(this))

    this.increment()
    this.pipe(destination)

    return destination
  }

  public override _read (): void {
  }

  private increment (): void {
    this.forks++
  }

  private decrement (): void {
    this.forks--

    if (this.forks === 0)
      this.destroy()
  }
}

const objectMode = { objectMode: true }
