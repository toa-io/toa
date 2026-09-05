import { console, decode, run, type SpanOptions } from 'openspan'
import { add } from '@toa.io/generic'
import { Connector } from './connector.js'
import type { Component } from './component.js'
import type { Receiver as Bridge } from './types/bridges.js'
import type { Message } from './types/message.js'
import type { Request, Source } from './types/request.js'

export interface Definition {
  conditioned?: boolean
  adaptive?: boolean
  operation: string
  label?: string
  destination?: string
  arguments?: unknown[]
  origin?: Source
}

export class Receiver extends Connector {
  readonly #conditioned: boolean | undefined
  readonly #adaptive: boolean | undefined
  readonly #endpoint: string
  readonly #label: string
  readonly #destination: string
  readonly #arguments: unknown[] | undefined
  readonly #origin: Source | undefined
  readonly #local: Component
  readonly #bridge: Bridge | undefined
  readonly #delivery: SpanOptions
  readonly #processing: SpanOptions

  public constructor (definition: Definition, local: Component, bridge?: Bridge) {
    super()

    const { conditioned, adaptive, operation } = definition

    this.#conditioned = conditioned
    this.#adaptive = adaptive
    this.#endpoint = operation
    this.#label = definition.label ?? operation
    this.#destination = definition.destination ?? this.#label
    this.#arguments = definition.arguments
    this.#origin = definition.origin

    this.#local = local
    this.#bridge = bridge

    this.depends(local)
    if (bridge !== undefined) this.depends(bridge)

    /*
     * The delivery span is created on behalf of the messaging destination, so that
     * each consumer forms its own complete producer/consumer pair, and service graphs
     * display fan-out correctly: producer -> destination -> each consumer
     * (Tempo pairs spans one-to-one, thus multiple consumers can not pair
     * with a single producer span, see grafana/tempo#5408)
     */
    this.#delivery = {
      name: `${this.#label} deliver`,
      kind: 'producer',
      service: this.#destination,
      attributes: { 'messaging.destination.name': this.#destination }
    }

    this.#processing = {
      name: `${this.#label} process`,
      kind: 'consumer',
      service: local.locator.id,
      attributes: { 'messaging.destination.name': this.#destination }
    }
  }

  /** @hot */
  public async receive (message: Message): Promise<void> {
    const { payload, telemetry, ...extensions } = message

    if (this.#conditioned === true &&
      await this.#bridge?.condition(payload) === false) return

    const request = await this.#request(payload)

    add(request, extensions)

    // set after `add`, so that a message field can not spoof the origin
    if (this.#origin !== undefined) request.source = this.#origin

    // continue the trace from the producer span
    const remote = telemetry === undefined ? null : decode(telemetry)
    const task = async (): Promise<void> => { await this.#process(request) }

    if (remote === null)
      await task()
    else
      await run(remote, task)
  }

  async #process (request: Request): Promise<void> {
    return console.span(this.#delivery, async () => console.span(this.#processing, async () => {
      try {
        await this.#local.invoke(this.#endpoint, request)
      } catch (error) {
        console.error('Receiver error', {
          component: this.#local.locator.id,
          endpoint: this.#endpoint,
          error
        })

        throw error
      }
    }))
  }

  async #request (payload: object): Promise<Request> {
    return this.#adaptive === true
      ? await this.#bridge!.request(payload, ...(this.#arguments ?? []))
      : { input: payload }
  }
}
