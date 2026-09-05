import { Connector } from './connector.js'
import type { Event } from './event.js'
import type { Event as StateEvent } from './types/state.js'

export class Emission extends Connector {
  readonly #events: Event[]

  public constructor (events: Event[]) {
    super()

    this.#events = events

    this.depends(events)
  }

  public async emit (event: StateEvent): Promise<void> {
    const emission = this.#events.map((e) => e.emit(event))

    await Promise.all(emission)
  }
}
