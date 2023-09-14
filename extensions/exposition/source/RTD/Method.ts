import { type Directives } from './Directives'
import { type Endpoint } from './Endpoint'

export class Method<
  TEndpoint extends Endpoint<TEndpoint> = any,
  TDirectives extends Directives<TDirectives> = any
> {
  public readonly endpoint: TEndpoint | null
  public readonly directives: TDirectives

  public constructor (endpoint: TEndpoint | null, directives: TDirectives) {
    this.endpoint = endpoint
    this.directives = directives
  }

  public async close (): Promise<void> {
    await this.endpoint?.close()
  }
}

export type Methods<
  TEndpoint extends Endpoint<TEndpoint> = any,
  TDirectives extends Directives<TDirectives> = any
> = Record<string, Method<TEndpoint, TDirectives>>
