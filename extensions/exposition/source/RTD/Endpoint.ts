import type * as core from '@toa.io/core'

export class Endpoint {
  private readonly discovery: Promise<core.Component>
  private readonly endpoint: string

  public constructor (discovery: Promise<core.Component>, endpoint: string) {
    this.discovery = discovery
    this.endpoint = endpoint
  }

  public async call (request: core.Request): Promise<core.Reply> {
    const remote = await this.discovery

    return await remote.invoke(this.endpoint, request)
  }
}
