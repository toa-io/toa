import type { Input } from './types.js'
import type { Parameter } from '../../RTD/index.js'
import type * as io from '../../io.js'

export abstract class Directive {
  public readonly name = 'octets.' + this.constructor.name.toLowerCase()
  public abstract readonly targeted: boolean

  public abstract apply (storage: string, input: Input, parameters: Parameter[]): Promise<io.Output>
}
