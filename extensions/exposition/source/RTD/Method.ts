import type { Endpoint } from './Endpoint'
import type { Directives } from './Directives'

export class Method {
  public readonly endpoint: Endpoint | null
  public readonly directives: Directives

  public constructor (endpoint: Endpoint | null, directives: Directives) {
    this.endpoint = endpoint
    this.directives = directives
  }

  public async explain (): Promise<unknown> {
    return (await this.endpoint?.explain()) ?? null
  }

  public async close (): Promise<void> {
    await this.endpoint?.close()
  }
}

export type Methods = Record<string, Method>
