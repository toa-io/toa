import type { Output } from '../../io'
import type { Directive } from './types'

export class Stub implements Directive {
  private readonly value: unknown

  public constructor (value: unknown) {
    this.value = value
  }

  public apply (): Output {
    return { body: this.value }
  }
}
