import { Directive } from './Directive.js'
import type { Output } from '../../io.js'

export class Context extends Directive {
  public readonly targeted = false
  public readonly storage: string

  public constructor(value: unknown) {
    super()

    if (typeof value !== 'string')
      throw new Error("Directive 'octets:context' must must be a string")

    this.storage = value
  }

  public async apply(): Promise<Output> {
    return null
  }
}
