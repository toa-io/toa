import { type Output } from '../../Directive'
import { type Directive } from './types'

export class Stub implements Directive {
  private readonly value: any

  public constructor (value: any) {
    this.value = value
  }

  public apply (): Output {
    return { status: 200, body: this.value }
  }
}
