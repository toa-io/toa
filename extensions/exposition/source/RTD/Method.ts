import type { Parameter } from './Match'
import type { Endpoint } from './Endpoint'
import type { Directives } from './Directives'

export class Method {
  public readonly endpoint: Endpoint | null
  public readonly directives: Directives
  private introspection: unknown | null = null
  private introspecting: Promise<unknown> | null = null

  public constructor (endpoint: Endpoint | null, directives: Directives) {
    this.endpoint = endpoint
    this.directives = directives
  }

  public async explain (parameters: Parameter[]): Promise<unknown> {
    if (this.introspection !== null)
      return this.introspection

    if (this.introspecting === null)
      // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
      this.introspecting = this.endpoint?.explain(parameters)!

    this.introspection = await this.introspecting

    return this.introspection
  }

  public async close (): Promise<void> {
    await this.endpoint?.close()
  }
}

export type Methods = Record<string, Method>
