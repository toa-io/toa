import * as schemas from './schemas'
import { Directive } from './Directive'
import type { Output } from '../../io'

export class Context extends Directive {
  public readonly targeted = false
  public readonly storage: string

  public constructor (value: unknown) {
    super()
    schemas.context.validate(value)

    this.storage = value
  }

  public async apply (): Promise<Output> {
    return null
  }
}
