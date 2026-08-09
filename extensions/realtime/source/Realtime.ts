import { console, run } from 'openspan'
import { type Component, Connector } from '@toa.io/core'
import { type Routes } from './Routes'
import type { Push } from './Receiver'

export class Realtime extends Connector {
  private readonly discovery: Promise<Component>
  private streams: Component | null = null

  public constructor (routes: Routes, discovery: Promise<Component>) {
    super()

    this.discovery = discovery

    routes.events.on('data', this.push.bind(this))
  }

  protected override async open (): Promise<void> {
    this.streams = await this.discovery
    this.depends(this.streams)

    await this.streams.connect()

    console.info('Realtime service started')
  }

  protected override dispose (): void {
    console.info('Realtime service shutdown complete')
  }

  private push ({ telemetry, ...event }: Push): void {
    const processing = telemetry === null
      ? this.deliver(event)
      : run(telemetry, async () => await this.deliver(event))

    void processing.catch((error) => console.error('Realtime push failed', error))
  }

  private async deliver (event: Omit<Push, 'telemetry'>): Promise<void> {
    /*
     * The delivery span is created on behalf of the messaging destination
     * (same as the core Receiver), so that service graphs display the fan-out:
     * producer -> destination -> realtime
     */
    const delivery = {
      name: `${event.event} deliver`,
      kind: 'producer' as const,
      service: event.event,
      attributes: { 'messaging.destination.name': event.event }
    }

    const options = {
      name: `${event.event} push`,
      kind: 'consumer' as const,
      service: 'realtime',
      attributes: { 'messaging.destination.name': event.event }
    }

    await console.span(delivery, async () => await console.span(options, async () => {
      await this.streams?.invoke('push', { input: event })
    }))
  }
}
