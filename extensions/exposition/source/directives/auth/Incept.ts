import { type Directive, type Identity, type Input } from './types'

export class Incept implements Directive {
  private readonly property: string

  public constructor (property: string) {
    this.property = property
  }

  public authorize (identity: Identity | null, input: Input): boolean {
    return true
  }
}
