import { type Directive, type Context } from './types.js'

export class Anonymous implements Directive {
  private readonly allow: boolean

  public constructor (allow: boolean) {
    this.allow = allow
  }

  /**
   * A credential refuses, because it would make the reply uncacheable — which is the whole
   * of the rule, and none of it applies to a procedure: what a procedure answers is a value
   * in an envelope, and the envelope is the one thing that is cached or not.
   */
  public authorize (_: any, context: Context): boolean {
    if (context.procedural)
      return this.allow

    return 'authorization' in context.request.headers
      ? false
      : this.allow
  }

  public admits (_: any, context: Context): boolean {
    return this.authorize(_, context)
  }
}
