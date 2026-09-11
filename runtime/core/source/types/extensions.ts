import type { Connector } from '../connector.ts'
import type { Locator } from '../locator.ts'
import type { Component } from '../component.ts'
import type { Remote } from '../remote.ts'
import type { Receiver } from './receiver.ts'
import type { Context } from '../context.ts'
import type { Storage } from './storages.ts'
import type { Broadcast, Emitter, Inbound, Outbound } from './bindings.ts'
import type { Atom } from './atomicity.ts'
import type { Source } from './request.ts'
import type { Destination } from './outbox.ts'

/**
 * What the process hosting an extension provides to it: the counterpart of a component's
 * context. What is returned is a connector the extension depends on.
 */
export interface Host {
  /** a component of the context, by locator */
  remote(locator: Locator, source?: Source): Promise<Remote>

  /** a channel of the messaging binding */
  broadcast<L extends string = string>(
    channel: string,
    group?: string
  ): Promise<Broadcast<L>>

  /** components to run inside the extension's own process */
  composition(paths: string[]): Promise<Connector>

  /** a consumer of an event of the context, `namespace.component.event` */
  receive(label: string, receiver: Receiver): Promise<Connector>

  /** what the replicas of one group decide together */
  atom(group: string): Atom

  /** where this deployment publishes a channel, over the brokers named */
  outbound(binding: string, channel: string, uris: string[]): Promise<Outbound>

  /** what arrives on a channel under one label */
  // eslint-disable-next-line max-params
  inbound(
    binding: string,
    channel: string,
    uris: string[],
    label: string,
    sink: Inbound
  ): Promise<Connector>
}

/**
 * `Manifest` is a type parameter rather than an import: `@toa.io/norm` depends on core, so
 * core cannot name its types.
 */
export interface Factory<Manifest = unknown> {
  tenant?(
    locator: Locator,
    declaration: any,
    manifest: Manifest
  ): Connector | Promise<Connector>

  aspect?(locator: Locator, declaration: any): Aspect | Aspect[]

  /**
   * Where a committed state change of this component goes, beside its own events. Read before
   * the storage is made, because one of these is what gives a component an outbox when it
   * declares no event at all.
   */
  destination?(
    locator: Locator,
    declaration: any,
    manifest: Manifest
  ): Destination | Promise<Destination> | undefined

  /** what the extension runs as a process of its own; `null` where it is off here */
  service?(): Connector | null | Promise<Connector | null>

  /**
   * What the extension keeps in every process, whatever that process runs — the counterpart of
   * `tenant` for a process rather than a component. Asked of every extension the process has
   * loaded, and the predefined ones are loaded by every process for this.
   *
   * `null` where the extension keeps nothing here.
   */
  resident?(host: Host): Resident | null | Promise<Resident | null>

  component?(component: Component): Component

  context?(context: Context): Context

  manage?(composition: Connector): Connector

  storage?(storage: Storage, locator: Locator): Storage

  emitter?(emitter: Emitter, label: string, locator: Locator): Emitter

  receiver?(receiver: Receiver, locator: Locator): Receiver
}

/**
 * A connector that lives as long as the process, whatever the process runs.
 *
 * It connects before what the process was built with and goes after it, which is what makes it
 * the place for something that answers for the process rather than for anything in it — the
 * readiness probe is the one this was written for.
 */
export interface Resident extends Connector {
  /** Everything the process was built with has connected. */
  complete?: () => Promise<void>
}

export interface Aspect extends Connector {
  /** the key it takes on the context; a duplicate is a boot error */
  readonly name: string

  invoke(...args: any[]): any
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
