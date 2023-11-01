import type { Output } from '../../Directive'
import type { Directive } from './types'

export class Context implements Directive {
  public readonly targeted = false
  public readonly storage

  public constructor (value: any) {
    this.storage = value
  }

  public apply (): Output {
    return null
  }
}
