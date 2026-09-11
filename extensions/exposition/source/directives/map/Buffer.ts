import { Mapping } from './Mapping.ts'
import type { Input } from '../../io.ts'

export class BufferMapping extends Mapping<string> {
  public constructor(property: string) {
    if (typeof property !== 'string') throw new Error('`map:buffer` must be a string')

    super(property)
  }

  public override async properties(context: Input): Promise<Record<string, string>> {
    return { [this.value]: (await context.buffer()).toString('utf8') }
  }
}
