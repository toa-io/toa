import { take } from '../../Introspection.js'
import type { Remotes } from '../../Remotes.js'
import type { Directive } from './Directive.js'
import type { Input } from '../../io.js'
import type { Parameter } from '../../RTD/index.js'
import type { Introspection } from '../../Introspection.js'

export abstract class Mapping<T = unknown> {
  protected value: T
  protected remotes?: Remotes

  protected constructor (value: T, remotes?: Remotes) {
    this.value = value
    this.remotes = remotes
  }

  public abstract properties (context: Input, parameters: Parameter[], directives: Directive[]): Output

  /**
   * What this mapping does to what the method says about itself, which is the reverse of
   * what it does to a request: a property the gateway fills is taken out of the input,
   * because it is not the caller's to send.
   *
   * The default says nothing more than that. A claim, an authority and a language come
   * from the request itself and there is nowhere for a caller to put one; a header and a
   * segment are the caller's, and those say where.
   */
  public explain (introspection: Introspection): void {
    for (const property of this.names())
      take(introspection, property)
  }

  /** The input properties this mapping fills, however its value names them. */
  protected names (): string[] {
    return typeof this.value === 'string'
      ? [this.value]
      : Object.keys(this.value as object)
  }
}

type Properties = Record<string, unknown> | null
type Output = Properties | Promise<Properties>
