import { Connector } from './connector.ts'
import type { Event, Raised } from './event.ts'
import type { Rendering as Declaration, Row } from './types/outbox.ts'

/**
 * The component's events, rendered for a destination that writes them somewhere of its own. The
 * condition and the payload are the component's, as they are for the events it publishes, so
 * what the destination writes is what a receiver of the event would have received.
 */
export class Rendering extends Connector implements Declaration {
  readonly #events: Map<string, Event>

  public constructor(events: Map<string, Event>) {
    super()

    this.#events = events

    this.depends([...events.values()])
  }

  public async render(label: string, row: Row): Promise<Raised | null> {
    const event = this.#events.get(label)

    if (event === undefined) throw new Error(`Event '${label}' is not rendered`)

    return await event.render(row)
  }
}
