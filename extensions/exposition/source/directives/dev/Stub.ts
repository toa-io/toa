import { type Directive } from '../index'
import { type OutgoingMessage } from '../../HTTP'

export class Stub implements Directive {
  private readonly value: any

  public constructor (value: any) {
    this.value = value
  }

  public async pre (): Promise<OutgoingMessage> {
    console.log('Stub pre')

    return { status: 200, body: this.value }
  }
}
