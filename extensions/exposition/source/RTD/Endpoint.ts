import type { Component, Reply, Request } from '@toa.io/core'

export class Endpoint {
  private readonly remote: Component
  private readonly endpoint: string

  public constructor (remote: Component, endpoint: string) {
    this.remote = remote
    this.endpoint = endpoint
  }

  public async call (request: Request): Promise<Reply> {
    return await this.remote.invoke(this.endpoint, request)
  }
}
