import type { Output } from '../../io.js'
import type { Directive } from './types.js'

export class Throw implements Directive {
  private readonly message: string

  public constructor (message: string) {
    this.message = message
  }

  public apply (): Output {
    throw new Error(this.message)
  }
}
