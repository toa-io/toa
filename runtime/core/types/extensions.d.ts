import * as _core from './index.js'
import * as _component from './component.js'
import * as _context from './context.js'
import * as _storages from './storages.js'
import * as _bindings from './bindings.js'
import { Manifest } from '@toa.io/norm'

/**
 * What the process hosting an extension provides to it: the counterpart of a component's
 * `Context`. What is returned is a connector the extension depends on.
 */
export interface Host {
  /** a component of the context, by locator */
  remote (locator: _core.Locator, source?: _core.Source): Promise<_core.Remote>

  /** a channel of the messaging binding */
  broadcast<T = unknown> (channel: string, group?: string): Promise<_bindings.Broadcast<T>>

  /** components to run inside the extension's own process */
  composition (paths: string[]): Promise<_core.Connector>

  /** a consumer of an event of the context, `namespace.component.event` */
  receive (label: string, receiver: _core.Receiver): Promise<_core.Connector>

  /** what the replicas of one group decide together */
  atom (group: string): _core.atomicity.Atom
}

export interface Factory {
  tenant? (locator: _core.Locator, manifest: object, component: Manifest):
  _core.Connector | Promise<_core.Connector>

  aspect? (locator: _core.Locator, manifest: object | null): Aspect | Aspect[]

  service? (name?: string): _core.Connector | null | Promise<_core.Connector | null>

  component? (component: _component.Component): _component.Component

  context? (context: _context.Context): _context.Context

  manage? (composition: _core.Connector): _core.Connector

  storage? (storage: _storages.Storage): _storages.Storage

  emitter? (emitter: _bindings.Emitter, label: string, locator: _core.Locator): _bindings.Emitter

  receiver? (receiver: _core.Receiver, locator: _core.Locator): _core.Receiver
}

export interface Aspect extends _core.Connector {
  name: string

  invoke (...args: any[]): any
}
