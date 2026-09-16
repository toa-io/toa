import { Connector, deliveries } from '@toa.io/core'
import type { Readable } from 'node:stream'
import type { Component, Locator } from '@toa.io/core'
import type { Reply, Request } from '@toa.io/core/types'
import type { Server } from './Server.ts'

/** Serves the endpoints of one component that take a stream, on the server of its own port. */
export class Producer extends Connector {
  private readonly server: Server
  private readonly locator: Locator
  private readonly endpoints: string[]
  private readonly component: Component
  private readonly pending = new Set<Promise<unknown>>()

  // eslint-disable-next-line max-params
  public constructor(
    server: Server,
    locator: Locator,
    endpoints: string[],
    component: Component
  ) {
    super()

    this.server = server
    this.locator = locator
    this.endpoints = endpoints
    this.component = component

    this.depends(server)
    this.depends(component)
  }

  protected override async open(): Promise<void> {
    for (const endpoint of this.endpoints)
      this.server.route(
        path(this.locator, endpoint),
        async (request) => await this.invoke(endpoint, request)
      )
  }

  /**
   * Takes no new call before the component it calls is taken apart, and waits for the calls it
   * holds: the component is a dependency, and is disconnected only once this has returned.
   */
  protected override async close(): Promise<void> {
    for (const endpoint of this.endpoints) this.server.unroute(path(this.locator, endpoint))

    await Promise.allSettled(this.pending)
  }

  private async invoke(endpoint: string, request: Request): Promise<Reply | Readable> {
    const promise = this.component.invoke(endpoint, request)

    this.pending.add(promise)
    deliveries.taken()

    try {
      return (await promise) as Reply | Readable
    } finally {
      this.pending.delete(promise)
      deliveries.done()
    }
  }
}

/** What a call to an endpoint is addressed to, which is what a caller writes on the request. */
export function path(locator: Locator, endpoint: string): string {
  return `/${locator.namespace}/${locator.name}/${endpoint}`
}
