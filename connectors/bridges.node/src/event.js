import { Connector } from '@toa.io/core'

/**
 * @implements {import('@toa.io/core/types').bridges.Event}
 */
export class Event extends Connector {
  #event
  #context

  constructor (event, context) {
    super()

    this.#event = event
    this.#context = context

    this.depends(context)
  }

  condition = async (...args) => this.#event.condition(...args, this.#context)
  payload = async (...args) => this.#event.payload(...args, this.#context)
}
