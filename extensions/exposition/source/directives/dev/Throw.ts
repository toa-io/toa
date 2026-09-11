import type { Output } from '../../io.ts'
import type { Directive } from './types.ts'

export class Throw implements Directive {
  private readonly message: string

  public constructor(message: string) {
    this.message = message
  }

  public apply(): Output {
    throw new Error(this.message)
  }
}
