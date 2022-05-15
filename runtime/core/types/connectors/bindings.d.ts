// noinspection ES6UnusedImports

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
