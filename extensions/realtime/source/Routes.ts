import { Readable } from 'node:stream'
import { console } from 'openspan'
import { Connector } from '@toa.io/core'
import { Receiver } from './Receiver.ts'
import { environment } from '@toa.io/generic'
import type { Route } from '@toa.io/definitions/extensions.realtime'
export type { Route } from '@toa.io/definitions/extensions.realtime'
import type { Host } from './Factory.ts'

export class Routes extends Connector {
  public events = new Events()

  private readonly host: Host

  public constructor(host: Host) {
    super()

    this.host = host
  }

  private static read(): Route[] {
    const value = environment.get('TOA_REALTIME')

    if (value === undefined) throw new Error('TOA_REALTIME is not defined')

    return JSON.parse(value) as Route[]
  }

  public override async open(): Promise<void> {
    const routes = Routes.read()
    const creating = []

    for (const { event, properties, expose } of routes) {
      const consumer = this.host.receive(
        event,
        new Receiver({ event, properties, stream: this.events, expose })
      )

      creating.push(consumer)
    }

    const consumers = await Promise.all(creating)

    // eslint-disable-next-line @typescript-eslint/promise-function-async
    const connecting = consumers.map((consumer) => consumer.connect())

    await Promise.all(connecting)
    this.depends(consumers)

    console.info('Event sources connected', { count: creating.length })
  }

  public override async close(): Promise<void> {
    console.info('Event sources disconnected')
  }
}

class Events extends Readable {
  public constructor() {
    super({ objectMode: true })
  }

  public override _read(): void {}
}
