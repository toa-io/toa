import type { Parameter } from './Match.js'
import type { Endpoint } from './Endpoint.js'
import type { Directives } from './Directives.js'
import type { Context } from '../HTTP/index.js'
import { order } from '../Introspection.js'
import type { Introspection } from '../Introspection.js'

export class Method {
  public readonly endpoint: Endpoint | null
  public readonly directives: Directives

  public constructor (endpoint: Endpoint | null, directives: Directives) {
    this.endpoint = endpoint
    this.directives = directives
  }

  /**
   * What this method says about itself, as its directives leave it, or nothing where they
   * refuse this caller. A method of no endpoint — one a directive answers on its own —
   * states nothing of its own, and its directives still have their say.
   */
  public async explain (context: Context, parameters: Parameter[]): Promise<Introspection | null> {
    const introspection = this.endpoint === null
      ? {}
      : await this.endpoint.explain(parameters)

    const described = await this.directives.explain(context, introspection)

    return described === null ? null : order(described)
  }

  public async close (): Promise<void> {
    await this.endpoint?.close()
  }
}

export type Methods = Record<string, Method>
