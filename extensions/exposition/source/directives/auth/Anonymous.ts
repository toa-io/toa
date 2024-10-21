import { type Directive, type Context } from './types'

export class Anonymous implements Directive {
  private readonly allow: boolean

  public constructor (allow: boolean) {
    this.allow = allow
  }

  public authorize (_: any, context: Context): boolean {
    return 'authorization' in context.request.headers
      ? false
      : this.allow
  }
}
