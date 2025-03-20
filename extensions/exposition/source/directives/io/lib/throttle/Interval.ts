import assert from 'node:assert'
import { EventEmitter } from 'node:events'

export class Interval extends EventEmitter {
  public number: number = 0
  private readonly interval: number

  public constructor (interval: number) {
    super()
    this.interval = interval
    this.number = Math.ceil(Date.now() / this.interval)

    const shift = this.number * this.interval - Date.now()

    assert.ok(shift >= 0, 'shift must be positive')

    setTimeout(this.start, shift)
  }

  public start = (): void => {
    setInterval(() => this.emit('tick'), this.interval)
  }
}
