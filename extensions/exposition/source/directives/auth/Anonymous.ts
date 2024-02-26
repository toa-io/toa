import { type Directive, type Input } from './types'

export class Anonymous implements Directive {
  private readonly allow: boolean

  public constructor (allow: boolean) {
    this.allow = allow
  }

  public authorize (_: any, input: Input): boolean {
    return 'authorization' in input.request.headers
      ? false
      : this.allow
  }
}
