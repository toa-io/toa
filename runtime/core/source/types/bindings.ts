import type { Readable } from 'node:stream'
import type { Connector } from '../connector.js'
import type { Locator } from '../locator.js'
import type { Component } from '../component.js'
import type { Receiver } from './receiver.js'
import type { Message } from './message.js'
import type { Reply, Request } from './request.js'

/** What a binding module exports beside its factory. */
export interface Properties {
  /** delivers asynchronously; an event's binding must */
  async?: boolean
  /** in-process: its producers are connected first and torn down last */
  local?: boolean
}

export interface Consumer extends Connector {
  /**
   * `false` says this binding does not carry the endpoint, and the transmission tries the
   * next one. A `Readable` is a streamed reply.
   */
  request (request: Request): Promise<Reply | Readable | false>

  /**
   * Absent where the binding cannot enqueue — a transmission skips a binding that offers
   * no `task` rather than failing over it.
   */
  task? (request: Request): Promise<void>
}

export interface Emitter extends Connector {
  emit (message: Message): Promise<void>
}

export interface Broadcast<L extends string = string> extends Connector {
  transmit<T> (label: L, payload: T): Promise<void>

  receive<T> (label: L, callback: (payload: T) => void | Promise<void>): Promise<void>
}

export interface Factory {
  producer (locator: Locator, endpoints: string[], component: Component): Connector

  consumer (locator: Locator, endpoint: string): Consumer

  /** only the binding an event declares is asked for one */
  emitter? (locator: Locator, label: string): Emitter

  /** `group` is absent for an exclusive subscription */
  // eslint-disable-next-line max-params
  receiver? (locator: Locator, label: string, group: string | undefined,
    receiver: Receiver): Connector

  broadcast? (name: string, group?: string): Broadcast
}
