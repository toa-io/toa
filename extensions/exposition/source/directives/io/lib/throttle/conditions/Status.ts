import type { Input, Output } from '../../../../../io.ts'
import type { Condition } from './Condition.ts'

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
