import type { Connector } from '../connector.js'
import type { Locator } from '../locator.js'
import type { Component } from '../component.js'
import type { Remote } from '../remote.js'
import type { Receiver } from './receiver.js'
import type { Context } from '../context.js'
import type { Storage } from './storages.js'
import type { Broadcast, Emitter } from './bindings.js'
import type { Atom } from './atomicity.js'
import type { Source } from './request.js'

/**
 * What the process hosting an extension provides to it: the counterpart of a component's
 * context. What is returned is a connector the extension depends on.
 */
export interface Host {
  /** a component of the context, by locator */
  remote (locator: Locator, source?: Source): Promise<Remote>

  /** a channel of the messaging binding */
  broadcast<L extends string = string> (channel: string, group?: string): Promise<Broadcast<L>>

  /** components to run inside the extension's own process */
  composition (paths: string[]): Promise<Connector>

  /** a consumer of an event of the context, `namespace.component.event` */
  receive (label: string, receiver: Receiver): Promise<Connector>

  /** what the replicas of one group decide together */
  atom (group: string): Atom
}

/**
 * `Manifest` is a type parameter rather than an import: `@toa.io/norm` depends on core, so
 * core cannot name its types.
 */
export interface Factory<Manifest = unknown> {
  tenant? (locator: Locator, declaration: any, manifest: Manifest):
  Connector | Promise<Connector>

  aspect? (locator: Locator, declaration: any): Aspect | Aspect[]

  /** what the extension runs as a process of its own; `null` where it is off here */
  service? (): Connector | null | Promise<Connector | null>

  component? (component: Component): Component

  context? (context: Context): Context

  manage? (composition: Connector): Connector

  storage? (storage: Storage): Storage

  emitter? (emitter: Emitter, label: string, locator: Locator): Emitter

  receiver? (receiver: Receiver, locator: Locator): Receiver
}

export interface Aspect extends Connector {
  /** the key it takes on the context; a duplicate is a boot error */
  readonly name: string

  invoke (...args: any[]): any
}

/**
 * What an extension puts on a component's context, as the extension states it. How it is
 * presented there is the bridge's — a bash bridge has no context to put anything on — and
 * what is declared here is the key and what it holds.
 */
export interface Contribution {
  /** the key on the context */
  name: string

  /** what the key holds, as TypeScript */
  type?: string

  /** what `type` names, by the module it comes from */
  imports?: Record<string, string[]>

  /** a JSON Schema to read the type from instead, where a component states one */
  schema?: object
}
