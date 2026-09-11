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

/**
 * How a call is carried, as its caller settled it. None of it is part of the request, and none of
 * it is sent as part of one.
 */
export interface Terms {
  /** the process an addressed call goes to */
  instance?: string
  /** milliseconds the caller waits, where it waits for a set time */
  timeout?: number
  /** aborts when the caller stops waiting */
  signal?: AbortSignal
}

export interface Consumer extends Connector {
  /**
   * `false` says this binding does not carry the endpoint, and the transmission tries the
   * next one. A `Readable` is a streamed reply.
   */
  request(request: Request, terms?: Terms): Promise<Reply | Readable | false>

  /**
   * Absent where the binding cannot enqueue — a transmission skips a binding that offers
   * no `task` rather than failing over it.
   */
  task?(request: Request): Promise<void>
}

export interface Emitter extends Connector {
  emit(message: Message): Promise<void>
}

export interface Broadcast<L extends string = string> extends Connector {
  transmit<T>(label: L, payload: T): Promise<void>

  receive<T>(label: L, callback: (payload: T) => void | Promise<void>): Promise<void>
}

export interface Factory {
  /** `stateful` are the endpoints among `endpoints` that take addressed calls only */
  // eslint-disable-next-line max-params
  producer(
    locator: Locator,
    endpoints: string[],
    component: Component,
    stateful?: string[]
  ): Connector

  consumer(locator: Locator, endpoint: string): Consumer

  /** only the binding an event declares is asked for one */
  emitter?(locator: Locator, label: string): Emitter

  /** `group` is absent for an exclusive subscription */
  // eslint-disable-next-line max-params
  receiver?(
    locator: Locator,
    label: string,
    group: string | undefined,
    receiver: Receiver
  ): Connector

  broadcast?(name: string, group?: string): Broadcast

  /**
   * A channel is a name the caller picks, from which the binding derives whatever its
   * transport needs, and `uris` are the brokers to carry it over — so a second broker set
   * costs the binding no configuration and no variable of its own.
   */
  outbound?(channel: string, uris: string[]): Outbound

  /** what arrives on `channel` under `label` */
  // eslint-disable-next-line max-params
  inbound?(channel: string, uris: string[], label: string, sink: Inbound): Connector
}

/**
 * Publishes to a channel, addressed by label. It forwards messages and nothing else: what
 * `send` is handed is what is published, with no envelope, no field and no header of the
 * binding's own, and none stripped — because a message shape is often somebody else's
 * contract, and an extension shipping changes into another system must be able to send
 * exactly what that system accepts.
 */
export interface Outbound extends Connector {
  send(label: string, message: object): Promise<void>
}

/** What a binding hands a message to. */
export interface Inbound {
  accept(message: object): Promise<void>
}
