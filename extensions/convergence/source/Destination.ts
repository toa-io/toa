import { console, current, encode, type SpanOptions } from 'openspan'
import { Connector } from '@toa.io/core'
import { CHANNEL } from '@toa.io/definitions/extensions.convergence'
import type { Locator } from '@toa.io/core'
import type { bindings, outbox } from '@toa.io/core/types'

/**
 * Where a committed state change of this component goes, beside its own events. The outbox
 * owns everything about getting it there — the row committed with the entity, the retry, the
 * drain — so this is only what the record becomes on the wire.
 */
export class Destination extends Connector implements outbox.Destination {
  public readonly name = CHANNEL

  private readonly label: string
  private readonly resolve: () => Promise<bindings.Outbound>
  private readonly span: SpanOptions

  private outbound!: bindings.Outbound

  public constructor(locator: Locator, resolve: () => Promise<bindings.Outbound>) {
    super()

    this.label = locator.id
    this.resolve = resolve

    this.span = {
      name: `${CHANNEL} send`,
      kind: 'producer',
      attributes: { 'messaging.destination.name': CHANNEL }
    }
  }

  public async emit(event: outbox.Row['event']): Promise<void> {
    await console.span(this.span, async () => {
      const context = current()

      /*
       * The record says which region wrote it, so the message does not say it again. `trace`
       * is convergence's own field rather than anything a binding puts there: it owns both
       * ends, and it wants the merge to continue the trace of the write that caused it.
       */
      const message: Message = { record: event.state }

      if (context !== undefined) message.trace = encode(context)

      await this.outbound.send(this.label, message)
    })
  }

  protected override async open(): Promise<void> {
    this.outbound = await this.resolve()

    await this.outbound.connect()

    this.depends(this.outbound)
  }
}

/** What convergence puts on the wire. Owned by this extension at both ends. */
export interface Message {
  /** the record as it stands — VERSION, timestamps, REGION and all */
  record: object

  /** W3C traceparent, so the merge continues the trace of the write that caused it */
  trace?: string
}
