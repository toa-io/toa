import { console } from 'openspan'

/**
 * A warning about a condition that holds for request after request, written once per
 * `interval` rather than once per request.
 */
export class Warning {
  private readonly message: string
  private readonly interval: number
  private last = -Infinity

  public constructor (message: string, interval: number = INTERVAL) {
    this.message = message
    this.interval = interval
  }

  public emit (attributes?: Record<string, unknown>): void {
    const now = Date.now()

    if (now - this.last < this.interval)
      return

    this.last = now

    console.warn(this.message, attributes)
  }
}

/** 100 seconds */
const INTERVAL = 100_000
