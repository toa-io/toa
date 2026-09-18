import { Consumer } from './Consumer.ts'
import { Producer } from './Producer.ts'
import { Server } from './Server.ts'
import { port } from './address.ts'
import type { Component, Connector, Locator } from '@toa.io/core'

/**
 * A server per port the components of this process are addressed at — one, where they share an
 * address, and one each where a development machine gives them their own.
 */
export class Factory {
  private readonly servers = new Map<number, Server>()

  // eslint-disable-next-line max-params
  public producer(
    locator: Locator,
    endpoints: string[],
    component: Component,
    _stateful?: string[],
    streamed: string[] = []
  ): Connector {
    // this binding carries a call that holds a stream, so it serves the endpoints that take one
    const carried = endpoints.filter((endpoint) => streamed.includes(endpoint))

    return new Producer(this.server(port(locator)), locator, carried, component)
  }

  public consumer(locator: Locator, endpoint: string): Consumer {
    return new Consumer(locator, endpoint)
  }

  private server(number: number): Server {
    let server = this.servers.get(number)

    if (server === undefined) {
      server = new Server(number)
      this.servers.set(number, server)
    }

    return server
  }
}
