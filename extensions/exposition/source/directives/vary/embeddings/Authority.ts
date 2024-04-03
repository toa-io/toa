import type { Embedding } from './Embedding'
import type { Input } from '../../../io'

export class Authority implements Embedding {
  public resolve (context: Input): string {
    return context.authority
  }
}
