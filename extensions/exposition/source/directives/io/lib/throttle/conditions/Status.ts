import type { Input, Output } from '../../../../../io.js'
import type { Condition } from './Condition.js'

export class Status implements Condition {
  private readonly status: number

  public constructor(status: unknown) {
    if (typeof status !== 'number') throw new Error('Status must be a number')

    this.status = status
  }

  public match(input: Input, output: Output): boolean {
    return output?.status === this.status
  }
}
