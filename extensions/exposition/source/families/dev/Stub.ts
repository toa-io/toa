import { type Output } from '../../Directives'
import { type Directive } from './Directive'

export class Stub implements Directive {
  private readonly value: any

  public constructor (value: any) {
    this.value = value
  }

  public apply (): Output {
    console.log('Stub pre')

    return { status: 200, body: this.value }
  }
}
