import { type Directive, type Context } from './types.js'

export class Anonymous implements Directive {
  private readonly allow: boolean

  public constructor(allow: boolean) {
    this.allow = allow
  }

  /**
   * A credential refuses, because it would make the reply uncacheable — which is the whole
   * of the rule, and none of it applies to a procedure, nor to a description. What a
   * procedure answers is a value in an envelope, and the envelope is the one thing that is
   * cached or not; what a description answers is what the resource is, which is not the
   * reply a cache would hold and varies by who asked in any case.
   */
  public authorize(_: any, context: Context): boolean {
    if (context.procedural || context.exploratory) return this.allow

    return 'authorization' in context.request.headers ? false : this.allow
  }

  public admits(_: any, context: Context): boolean {
    return this.authorize(_, context)
  }
}
