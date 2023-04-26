import * as _core from './index'
import * as _component from './component'
import * as _context from './context'
import * as _storages from './storages'
import * as _bindings from './bindings'

declare namespace toa.core.extensions {

  interface Factory {
    tenant?(locator: _core.Locator, declaration: object): _core.Connector

    aspect?(locator: _core.Locator, declaration: object): Aspect | Aspect[]

    service?(name?: string): _core.Connector

    component?(component: _component.Component): _component.Component

    context?(context: _context.Context): _context.Context

    storage?(storage: _storages.Storage): _storages.Storage

    emitter?(emitter: _bindings.Emitter, label: string): _bindings.Emitter

    receiver?(receiver: _core.Receiver, locator: _core.Locator): _core.Receiver
  }

  interface Aspect extends _core.Connector {
    name: string

    invoke: Function
  }

}

export type Factory = toa.core.extensions.Factory
export type Aspect = toa.core.extensions.Aspect
