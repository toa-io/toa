import assert from 'node:assert'
import { EventEmitter } from 'node:events'

export class Interval extends EventEmitter {
  public number: number = 0
  private timeout: ReturnType<typeof setTimeout> | null = null
  private interval: ReturnType<typeof setInterval> | null = null

  public constructor (interval: number) {
    super()

    const number = Math.ceil(Date.now() / interval)
    const shift = number * interval - Date.now()

    assert.ok(shift >= 0, 'shift must be positive')

    this.timeout = setTimeout(() => this.start(interval), shift)
    this.timeout.unref()
  }

  public start (interval: number): void {
    this.timeout = null
    this.interval = setInterval(() => this.emit('tick'), interval)
    this.interval.unref()
  }

  public dispose (): void {
    if (this.timeout !== null) {
      clearTimeout(this.timeout)
      this.timeout = null
    }

    if (this.interval !== null) {
      clearInterval(this.interval)
      this.interval = null
    }

    this.removeAllListeners()
  }
}
