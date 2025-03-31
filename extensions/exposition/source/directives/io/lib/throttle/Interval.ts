import assert from 'node:assert'
import { EventEmitter } from 'node:events'

export class Interval extends EventEmitter {
  public number: number = 0
  private interval: ReturnType<typeof setInterval> | null = null

  public constructor (interval: number) {
    super()

    const number = Math.ceil(Date.now() / interval)
    const shift = number * interval - Date.now()

    assert.ok(shift >= 0, 'shift must be positive')

    setTimeout(() => this.start(interval), shift)
  }

  public start (interval: number): void {
    this.interval = setInterval(() => this.emit('tick'), interval)
  }

  public dispose (): void {
    if (this.interval !== null) {
      clearInterval(this.interval)
      this.interval = null
    }

    this.removeAllListeners()
  }
}
