import type { Parameter } from './Match.ts'
import type { Endpoint } from './Endpoint.ts'
import type { Directives } from './Directives.ts'
import type { Context } from '../HTTP/index.ts'
import { order } from '../Introspection.ts'
import type { Introspection } from '../Introspection.ts'

export class Method {
  public readonly endpoint: Endpoint | null
  public readonly directives: Directives

  /** What this method is, built on the first answer that describes it. See `described`. */
  #description?: Promise<Introspection | null>

  public constructor(endpoint: Endpoint | null, directives: Directives) {
    this.endpoint = endpoint
    this.directives = directives
  }

  /**
   * What this method says about itself, as its directives leave it, or nothing where they
   * refuse this caller. A method of no endpoint — one a directive answers on its own —
   * states nothing of its own, and its directives still have their say.
   */
  public async explain(
    context: Context,
    parameters: Parameter[]
  ): Promise<Introspection | null> {
    if (!(await this.directives.admits(context))) return null

    return await this.describe(parameters)
  }

  /**
   * What the method is, which is the route's and not the caller's: the operation's own
   * description, what the directives fill in, and what a hidden method answers instead,
   * which is nothing. Built once and answered to everyone admitted, so whoever reads it
   * reads it and leaves it as it is.
   *
   * Under no key: a branch that changes is merged as methods of its own, and this one is
   * dropped with the node that holds it.
   */
  public async describe(parameters: Parameter[]): Promise<Introspection | null> {
    this.#description ??= this.build(parameters)

    return await this.#description
  }

  private async build(parameters: Parameter[]): Promise<Introspection | null> {
    const introspection =
      this.endpoint === null ? {} : await this.endpoint.explain(parameters)

    const described = this.directives.describe(introspection)

    return described === null ? null : order(described)
  }

  public async close(): Promise<void> {
    await this.endpoint?.close()
  }
}

export type Methods = Record<string, Method>
