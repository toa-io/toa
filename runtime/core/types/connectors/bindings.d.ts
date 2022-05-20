// noinspection ES6UnusedImports,JSUnusedGlobalSymbols

import { Connector, Locator, Receiver, Reply, Request, Runtime } from '..'

declare namespace toa.core.connectors.bindings {

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
        producer?(locator: Locator, endpoints: Array<string>, producer: Runtime): Connector

        consumer?(locator: Locator, endpoint: string): Consumer

        emitter?(locator: Locator, label: string): Emitter

        receiver?(locator: Locator, label: string, id: string, receiver: Receiver): Connector

        broadcaster?(name: string, group?: string): Broadcaster
    }

}

export type Consumer = toa.core.connectors.bindings.Consumer
export type Emitter = toa.core.connectors.bindings.Emitter
export type Broadcaster = toa.core.connectors.bindings.Broadcaster
export type Factory = toa.core.connectors.bindings.Factory
