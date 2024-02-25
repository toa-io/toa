import { performance } from 'node:perf_hooks'
import type { ServerResponse } from 'node:http'

export class Timing {
  private readonly skip: boolean
  private readonly start = performance.now()
  private readonly breakpoints: Breakpoint[] = []

  public constructor (enabled: boolean) {
    this.skip = !enabled
  }

  public async capture<T> (id: string, promise: Promise<T>): Promise<T> {
    if (this.skip)
      return promise

    const start = performance.now()
    const result = promise instanceof Promise ? await promise : promise

    this.breakpoints.push({ id, duration: performance.now() - start })

    return result
  }

  public append (response: ServerResponse): void {
    if (this.skip)
      return

    this.breakpoints.push({ id: 'total', duration: performance.now() - this.start })

    for (const breakpoint of this.breakpoints)
      response.appendHeader('server-timing',
        `${breakpoint.id};dur=${breakpoint.duration.toFixed(3)}`)
  }
}

interface Breakpoint {
  id: string
  duration: number
}
