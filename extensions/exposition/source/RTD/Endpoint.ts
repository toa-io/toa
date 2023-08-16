import { type Component, type Request, type Reply } from '@toa.io/core'

export class Endpoint {
  private readonly discovery: Promise<Component>
  private readonly endpoint: string
  private remote: Component | null = null

  public constructor (discovery: Promise<Component>, endpoint: string) {
    this.discovery = discovery
    this.endpoint = endpoint
  }

  public async call (request: Request): Promise<Reply> {
    this.remote ??= await this.discovery

    return await this.remote.invoke(this.endpoint, request)
  }
}
