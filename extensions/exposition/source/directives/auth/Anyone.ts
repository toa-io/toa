import { type Directive, type Context } from './types.js'
import type { Introspection } from '../../Introspection.js'

export class Anyone implements Directive {
  private readonly allow: boolean

  public constructor(allow: boolean) {
    this.allow = allow
  }

  public authorize(_: any, context: Context): boolean {
    return context.identity !== null && this.allow
  }

  public admits(_: any, context: Context): boolean {
    return this.authorize(_, context)
  }

  /** Whoever asks, as long as they are somebody. */
  public describe(introspection: Introspection): Introspection {
    return this.allow ? { ...introspection, authenticated: true } : introspection
  }
}
