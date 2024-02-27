import { type Directives } from './Directives'
import { type Endpoint } from './Endpoint'

export class Method<
  TDirectives extends Directives<TDirectives> = any
> {
  public readonly endpoint: Endpoint | null
  public readonly directives: TDirectives

  public constructor (endpoint: Endpoint | null, directives: TDirectives) {
    this.endpoint = endpoint
    this.directives = directives
  }

  public async close (): Promise<void> {
    await this.endpoint?.close()
  }
}

export type Methods<
  TDirectives extends Directives<TDirectives> = any
> = Record<string, Method<TDirectives>>
