import { type Directive } from './types'

export class Stub implements Directive<any> {
  public readonly value: any

  public constructor (value: any) {
    this.value = value
  }

  public apply (): void {
  }
}
