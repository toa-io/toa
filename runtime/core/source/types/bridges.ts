import type { Readable } from 'node:stream'
import type { Connector } from '../connector.js'
import type { Context } from '../context.js'
import type { Event as StateEvent } from './state.js'
import type { Reply, Request } from './request.js'

/**
 * What runs one endpoint. `mount` and `unmount` are the component author's, called by the
 * bridge as it opens and closes; core only ever asks for `execute`.
 */
export interface Algorithm extends Connector {
  execute (input: any, scope?: object | object[]): Promise<Reply | Readable>
}

export interface Event extends Connector {
  condition (event: StateEvent): Promise<boolean>

  payload (event: StateEvent): Promise<object>
}

export interface Receiver extends Connector {
  condition (payload: object): Promise<boolean>

  /** the trailing arguments are what the receiver declaration named */
  request (payload: object, ...args: unknown[]): Promise<Request>
}

/** Runs on every change to an entity's state, before the contract is applied. */
export interface Guard {
  fit (state: object, origin: object | null): boolean
}

/** Connectors whose lifecycle moments are the component's. */
export interface RunCommands {
  preflight?: Connector
  settle?: Connector
  dispose?: Connector
}

export interface Factory {
  algorithm (path: string, endpoint: string, context: Context): Algorithm | Promise<Algorithm>

  event? (path: string, label: string, context: Context): Event | Promise<Event>

  receiver? (path: string, label: string): Receiver | Promise<Receiver>

  guard? (path: string, name: string, context: Context): Guard | Promise<Guard>

  rc? (path: string, context: Context): Promise<RunCommands | undefined>
}
