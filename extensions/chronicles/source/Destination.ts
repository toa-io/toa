import { console, current, encode, type SpanOptions } from 'openspan'
import { Connector, entities } from '@toa.io/core'
import { CHANNEL } from '@toa.io/definitions/extensions.chronicles'
import { time, type Message } from './Message.ts'
import type { Channel } from './Channel.ts'
import type { Locator } from '@toa.io/core'
import type { bindings, outbox } from '@toa.io/core/types'

/**
 * Where a committed state change of a component goes for the log: each event the component names
 * under `chronicles`, rendered by the event's own condition and payload, so the log is given what
 * a receiver of the event would have been. The outbox owns getting it there — the row committed
 * with the entity, the retry, the drain — so this is only what the row becomes on the wire.
 */
export class Destination extends Connector implements outbox.Destination {
  public readonly name = CHANNEL
  public readonly renders: string[]
  public rendering?: outbox.Rendering

  private readonly locator: Locator
  private readonly channel: Channel
  private readonly span: SpanOptions
  private outbound!: bindings.Outbound

  public constructor(locator: Locator, labels: string[], channel: Channel) {
    super()

    this.locator = locator
    this.renders = labels
    this.channel = channel

    this.span = {
      name: `${CHANNEL} send`,
      kind: 'producer',
      attributes: { 'messaging.destination.name': CHANNEL }
    }
  }

  /** The messages of one row together: the row is settled once all of them are confirmed. */
  public async emit(row: outbox.Row): Promise<void> {
    await console.span(this.span, async () => {
      const messages = await this.render(row)

      await Promise.all(
        messages.map(async (message) => await this.channel.send(this.outbound, message))
      )
    })
  }

  protected override async open(): Promise<void> {
    this.outbound = await this.channel.open()

    this.depends(this.outbound)
  }

  private async render(row: outbox.Row): Promise<Message[]> {
    const context = current()
    const trace = context === undefined ? null : encode(context)
    const state = row.event.state as Record<string, unknown>
    const messages: Message[] = []

    for (const event of this.renders) {
      const raised = await this.rendering!.render(event, row)

      if (raised === null) continue

      const label = `${this.locator.id}.${event}`

      messages.push({
        // the id the event itself is published with, so one row is one row of the log under
        // each label however often the outbox sends it
        id: entities.derive(row.id, label),
        label,
        component: this.locator.id,
        time: time(row.id),
        entity: state.id as string,
        version: state.VERSION as number,
        trace,
        payload: raised.payload ?? null
      })
    }

    return messages
  }
}
