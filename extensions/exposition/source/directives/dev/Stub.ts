import type { Output } from '../../io.ts'
import type { Directive } from './types.ts'

export class Stub implements Directive {
  private readonly value: unknown

  public constructor(value: unknown) {
    this.value = value
  }

  public apply(): Output {
    return { body: this.value }
  }
}
