import type { Component, Reply, Request } from '@toa.io/core'

export class Endpoint {
  private readonly discovery: Promise<Component>
  private readonly endpoint: string

  public constructor (discovery: Promise<Component>, endpoint: string) {
    this.discovery = discovery
    this.endpoint = endpoint
  }

  public async call (request: Request): Promise<Reply> {
    const remote = await this.discovery

    return await remote.invoke(this.endpoint, request)
  }
}
