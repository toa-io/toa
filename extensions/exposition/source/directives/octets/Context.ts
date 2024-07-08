import assert from 'node:assert'
import { Directive } from './Directive'
import type { Output } from '../../io'

export class Context extends Directive {
  public readonly targeted = false
  public readonly storage: string

  public constructor (value: unknown) {
    super()

    assert.ok(typeof value === 'string', 'Directive \'octets:context\' must must be a string')

    this.storage = value
  }

  public async apply (): Promise<Output> {
    return null
  }
}
