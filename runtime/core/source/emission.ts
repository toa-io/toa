import { Connector } from './connector.js'
import type { Event } from './event.js'
import type { Row } from './types/outbox.js'

export class Emission extends Connector {
  /** what a row is outstanding for while this has not published it */
  public readonly name = 'events'

  readonly #events: Event[]

  public constructor(events: Event[]) {
    super()

    this.#events = events

    this.depends(events)
  }

  public async emit(row: Row): Promise<void> {
    const emission = this.#events.map((e) => e.emit(row))

    await Promise.all(emission)
  }
}
