import assert from 'node:assert'
import { Mapping } from './Mapping'
import type { Input } from '../../io'

export class BufferMapping extends Mapping<string> {
  public constructor (property: string) {
    assert.ok(typeof property === 'string', '`map:buffer` must be a string')

    super(property)
  }

  public override async properties (context: Input): Promise<Record<string, string>> {
    return { [this.value]: (await context.buffer()).toString('utf8') }
  }
}
