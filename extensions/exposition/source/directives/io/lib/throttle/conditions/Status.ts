import assert from 'node:assert'
import type { Input, Output } from '../../../../../io'
import type { Condition } from './Condition'

export class Status implements Condition {
  private readonly status: number

  public constructor (status: unknown) {
    assert.ok(typeof status === 'number', 'Status must be a number')

    this.status = status
  }

  public match (input: Input, output: Output): boolean {
    return output?.status === this.status
  }
}
