// noinspection ES6UnusedImports,JSUnusedGlobalSymbols

import { Connector, Locator, Receiver, Reply, Request, Component } from './index'

declare namespace toa.core.bindings {

  interface Consumer extends Connector {
    request(request: Request): Promise<Reply>
  }

  interface Emitter extends Connector {
    emit(payload: object): Promise<void>
  }

  interface Broadcaster extends Connector {
    send(label: string, payload: Object): Promise<void>

    receive(label: string, callback: (payload: object) => Promise<void>): Promise<void>
  }

  interface Factory {
    producer?(locator: Locator, endpoints: Array<string>, producer: Component): Connector

    consumer?(locator: Locator, endpoint: string): Consumer

    emitter?(locator: Locator, label: string): Emitter

    receiver?(locator: Locator, label: string, id: string, receiver: Receiver): Connector

    broadcaster?(name: string, group?: string): Broadcaster
  }

}

export type Consumer = toa.core.bindings.Consumer
export type Emitter = toa.core.bindings.Emitter
export type Broadcaster = toa.core.bindings.Broadcaster
export type Factory = toa.core.bindings.Factory
