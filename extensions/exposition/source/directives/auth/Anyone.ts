import { type Directive, type Context } from './types'

export class Anyone implements Directive {
  private readonly allow: boolean

  public constructor (allow: boolean) {
    this.allow = allow
  }

  public authorize (_: any, context: Context): boolean {
    return context.identity !== null && this.allow
  }
}
