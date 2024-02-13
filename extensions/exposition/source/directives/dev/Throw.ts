import type { Output } from '../../io'
import type { Directive } from './types'

export class Throw implements Directive {
  private readonly message: string

  public constructor (message: string) {
    this.message = message
  }

  public apply (): Output {
    throw new Error(this.message)
  }
}
