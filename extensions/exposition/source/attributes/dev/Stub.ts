import { type Attribute } from '../../attributes'
import { type OutgoingMessage } from '../../HTTP'

export class Stub implements Attribute {
  private readonly value: any

  public constructor (value: any) {
    this.value = value
  }

  public async pre (): Promise<OutgoingMessage> {
    return { status: 200, body: this.value }
  }
}
