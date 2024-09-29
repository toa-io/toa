import { type Directive, type Input } from './types'

export class Anyone implements Directive {
  private readonly allow: boolean

  public constructor (allow: boolean) {
    this.allow = allow
  }

  public authorize (_: any, input: Input): boolean {
    return input.identity !== null && this.allow
  }
}
