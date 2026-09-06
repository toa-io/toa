import { performance } from 'node:perf_hooks'
import type { ServerResponse } from './types.js'

/** How long the request took, from received to written: one number, the header's. */
export class Timing {
  private readonly start = performance.now()

  public append (response: ServerResponse): void {
    response.setHeader('server-timing', `total;dur=${(performance.now() - this.start).toFixed(3)}`)
  }
}
