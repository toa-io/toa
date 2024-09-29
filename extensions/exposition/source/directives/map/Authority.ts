import assert from 'node:assert'
import { Mapping } from './Mapping'
import type { Input } from '../../io'

export class Authority extends Mapping<string> {
  public constructor (property: string) {
    assert.ok(typeof property === 'string', '`map:authority` must be a string')

    super(property)
  }

  public properties (context: Input): Record<string, string> {
    return { [this.value]: context.authority }
  }
}
