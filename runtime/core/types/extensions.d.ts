import * as _core from './index'
import * as _component from './component'
import * as _context from './context'
import * as _storages from './storages'
import * as _bindings from './bindings'
import { Manifest } from '@toa.io/norm'

export interface Factory {
  tenant? (locator: _core.Locator, manifest: object, component: Manifest): _core.Connector

  aspect? (locator: _core.Locator, manifest: object | null): Aspect | Aspect[]

  service? (name?: string): _core.Connector | null

  component? (component: _component.Component): _component.Component

  context? (context: _context.Context): _context.Context

  storage? (storage: _storages.Storage): _storages.Storage

  emitter? (emitter: _bindings.Emitter, label: string): _bindings.Emitter

  receiver? (receiver: _core.Receiver, locator: _core.Locator): _core.Receiver
}

export interface Aspect extends _core.Connector {
  name: string

  invoke (...args: any[]): any
}
