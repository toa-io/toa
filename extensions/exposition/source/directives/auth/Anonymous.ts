import { type Directive, type Input } from './types'

export class Anonymous implements Directive {
  private readonly allow: boolean

  public constructor (allow: boolean) {
    this.allow = allow
  }

  public authorize (_: any, input: Input): boolean {
    if ('authorization' in input.headers) return false
    else return this.allow
  }
}
