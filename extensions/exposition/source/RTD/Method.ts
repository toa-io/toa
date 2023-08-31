import { type Directives } from './Directives'
import { type Endpoint } from './Endpoint'

export class Method<
  IEndpoint extends Endpoint<IEndpoint> = any,
  IDirectives extends Directives<IDirectives> = any
> {
  public readonly endpoint: IEndpoint | null
  public readonly directives: IDirectives

  public constructor (endpoint: IEndpoint | null, directives: IDirectives) {
    this.endpoint = endpoint
    this.directives = directives
  }

  public async close (): Promise<void> {
    await this.endpoint?.close()
  }
}

export type Methods<
  IEndpoint extends Endpoint<IEndpoint> = any,
  IDirectives extends Directives<IDirectives> = any
> = Record<string, Method<IEndpoint, IDirectives>>
