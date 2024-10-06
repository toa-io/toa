import type { Remotes } from '../../Remotes'
import type { Directive } from './Directive'
import type { Input } from '../../io'
import type { Parameter } from '../../RTD'

export abstract class Mapping<T = unknown> {
  protected value: T
  protected remotes?: Remotes

  protected constructor (value: T, remotes?: Remotes) {
    this.value = value
    this.remotes = remotes
  }

  public abstract properties (context: Input, parameters: Parameter[], directives: Directive[]): Output
}

type Properties = Record<string, unknown> | null
type Output = Properties | Promise<Properties>
