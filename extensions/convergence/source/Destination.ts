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

  /** whether the storage under this component turned out to be one that does not converge */
  private disabled = false

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

  /**
   * Stands down: the half that receives found a storage that does not converge, so neither
   * does this component, and publishing what no region will consume would be returns and
   * nothing else. The row settles at once rather than staying outstanding for good.
   */
  public disable(): void {
    this.disabled = true
  }

  public async emit(row: outbox.Row): Promise<void> {
    if (this.disabled) return

    await console.span(this.span, async () => {
      const context = current()

      /*
       * The record says which region wrote it, so the message does not say it again. `trace`
       * is convergence's own field rather than anything a binding puts there: it owns both
       * ends, and it wants the far side to continue the trace of the write that caused it.
       *
       * `row.trail` is deliberately not carried. The far side writes the record through the
       * storage rather than through an operation, so it makes no call and publishes no event —
       * there is no chain there to continue, and nothing to refuse.
       */
      const message: Message = { record: row.event.state }

      if (context !== undefined) message.trace = encode(context)

      await this.outbound.send(this.label, message)
    })
  }

  protected override async open(): Promise<void> {
    if (this.disabled) return

    this.outbound = await this.resolve()

    await this.outbound.connect()

    this.depends(this.outbound)
  }
}

/** What convergence puts on the wire. Owned by this extension at both ends. */
export interface Message {
  /** the record as it stands — VERSION, timestamps, REGION and all */
  record: object

  /** W3C traceparent, so the far side continues the trace of the write that caused it */
  trace?: string
}
