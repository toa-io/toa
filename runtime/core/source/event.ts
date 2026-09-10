import { console, current, encode, type SpanOptions } from 'openspan'
import { Connector } from './connector.js'
import type { Emitter } from './types/bindings.js'
import type { Event as Bridge } from './types/bridges.js'
import type { Message } from './types/message.js'
import type { Row } from './types/outbox.js'

export interface Definition {
  conditioned?: boolean
  subjective?: boolean
  label?: string
}

export class Event extends Connector {
  readonly #emitter: Emitter
  readonly #bridge: Bridge | undefined
  readonly #conditioned: boolean | undefined
  readonly #subjective: boolean | undefined
  readonly #label: string

  public constructor(definition: Definition, emitter: Emitter, bridge?: Bridge) {
    super()

    this.#conditioned = definition.conditioned
    this.#subjective = definition.subjective
    this.#label = definition.label ?? 'event'
    this.#emitter = emitter
    this.#bridge = bridge

    this.depends(emitter)

    if (bridge !== undefined) this.depends(bridge)
  }

  public async emit(row: Row): Promise<void> {
    const event = row.event

    if (this.#conditioned === false || (await this.#bridge?.condition(event)) === true) {
      const payload =
        this.#subjective === true ? await this.#bridge?.payload(event) : event.state

      const message: Message = { payload }

      // the chain the change was made by, so a receiver of this continues it rather than
      // starting one; read off the row, because the pump publishes off the operation's path
      if (row.trail !== undefined) message.trail = row.trail

      const options: SpanOptions = {
        name: `${this.#label} publish`,
        kind: 'producer',
        attributes: { 'messaging.destination.name': this.#label }
      }

      await console.span(options, async () => {
        const context = current()

        if (context !== undefined) message.telemetry = encode(context)

        await this.#emitter.emit(message)
      })
    }
  }
}
