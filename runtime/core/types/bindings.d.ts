import * as _core from './index'

declare namespace toa.core.bindings {

  interface Consumer extends _core.Connector {
    request(request: Request): Promise<_core.Reply>
  }

  interface Emitter extends _core.Connector {
    emit(message: _core.Message): Promise<void>
  }

  interface Broadcaster extends _core.Connector {
    send(label: string, payload: Object): Promise<void>

    receive(label: string, callback: (payload: object) => Promise<void>): Promise<void>
  }

  interface Factory {
    producer?(locator: _core.Locator, endpoints: Array<string>, producer: _core.Component): _core.Connector

    consumer?(locator: _core.Locator, endpoint: string): Consumer

    emitter?(locator: _core.Locator, label: string): Emitter

    receiver?(locator: _core.Locator, label: string, id: string, receiver: _core.Receiver): _core.Connector

    broadcaster?(name: string, group?: string): Broadcaster
  }

}

export type Consumer = toa.core.bindings.Consumer
export type Emitter = toa.core.bindings.Emitter
export type Broadcaster = toa.core.bindings.Broadcaster
export type Factory = toa.core.bindings.Factory
