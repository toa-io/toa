import { Mapping } from './Mapping.js'
import type { Input } from '../../io.js'

export class Authority extends Mapping<string> {
  public constructor(property: string) {
    if (typeof property !== 'string') throw new Error('`map:authority` must be a string')

    super(property)
  }

  public properties(context: Input): Record<string, string> {
    return { [this.value]: context.authority }
  }
}
