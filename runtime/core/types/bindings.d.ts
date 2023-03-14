import * as _core from './index'

declare namespace toa.core.bindings {

  type Properties = {
    async?: boolean
  }

  interface Consumer extends _core.Connector {
    request(request: Request): Promise<_core.Reply>
  }

  interface Emitter extends _core.Connector {
    emit(message: _core.Message): Promise<void>
  }

  interface Broadcast extends _core.Connector {
    transmit(label: string, payload: object): Promise<void>

    receive(label: string, callback: (payload: object) => Promise<void>): Promise<void>
  }

  interface Factory {
    producer?(locator: _core.Locator, endpoints: Array<string>, producer: _core.Component): _core.Connector

    consumer?(locator: _core.Locator, endpoint: string): Consumer

    emitter?(locator: _core.Locator, label: string): Emitter

    receiver?(locator: _core.Locator, label: string, group: string, receiver: _core.Receiver): _core.Connector

    broadcast?(name: string, group?: string): Broadcast
  }

}

export type Emitter = toa.core.bindings.Emitter
export type Factory = toa.core.bindings.Factory
export type Properties = toa.core.bindings.Properties
