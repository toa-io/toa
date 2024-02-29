import type { Input } from './types'
import type { Parameter } from '../../RTD'
import type * as io from '../../io'

export abstract class Directive {
  public readonly name = this.constructor.name.toLowerCase()
  public abstract readonly targeted: boolean

  public abstract apply (storage: string, input: Input, parameters: Parameter[]): Promise<io.Output>
}
