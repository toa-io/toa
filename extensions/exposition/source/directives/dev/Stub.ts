import type { Output } from '../../io.js'
import type { Directive } from './types.js'

export class Stub implements Directive {
  private readonly value: unknown

  public constructor (value: unknown) {
    this.value = value
  }

  public apply (): Output {
    return { body: this.value }
  }
}
