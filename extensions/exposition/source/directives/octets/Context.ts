import * as schemas from './schemas'
import type { Output } from '../../io'
import type { Directive } from './types'

export class Context implements Directive {
  public readonly targeted = false
  public readonly storage: string

  public constructor (value: unknown) {
    schemas.context.validate(value)

    this.storage = value
  }

  public apply (): Output {
    return null
  }
}
