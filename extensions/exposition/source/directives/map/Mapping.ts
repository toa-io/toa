import type { Directive } from './Directive'
import type { Input } from '../../io'
import type { Parameter } from '../../RTD'

export abstract class Mapping<T = unknown> {
  protected value: T

  protected constructor (value: T) {
    this.value = value
  }

  public abstract properties (context: Input, parameters: Parameter[], directives: Directive[]): Record<string, unknown> | null
}
