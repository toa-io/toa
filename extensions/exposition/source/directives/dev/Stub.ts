import type { Output } from '../../io'
import type { Directive } from './types'

export class Stub implements Directive {
  private readonly value: any

  public constructor (value: any) {
    this.value = value
  }

  public apply (): Output {
    return { body: this.value }
  }
}
