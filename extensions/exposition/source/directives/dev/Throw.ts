import { type Output } from '../../Directive'
import { type Directive } from './types'

export class Throw implements Directive {
  private readonly message: any

  public constructor (message: any) {
    this.message = message
  }

  public apply (): Output {
    throw new Error(this.message)
  }
}
