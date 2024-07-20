import { Readable } from 'node:stream'
import { console } from 'openspan'
import { Connector } from '@toa.io/core'
import { decode } from '@toa.io/generic'
import { type Bootloader } from './Factory'
import { Receiver } from './Receiver'

export class Routes extends Connector {
  public events = new Events()

  private readonly boot: Bootloader

  public constructor (boot: Bootloader) {
    super()

    this.boot = boot
  }

  private static read (): Route[] {
    if (process.env.TOA_REALTIME === undefined)
      throw new Error('TOA_REALTIME is not defined')

    return decode<Route[]>(process.env.TOA_REALTIME)
  }

  public override async open (): Promise<void> {
    const routes = Routes.read()
    const creating = []

    for (const { event, properties } of routes) {
      const consumer = this.boot.receive(event, new Receiver(event, properties, this.events))

      creating.push(consumer)
    }

    const consumers = await Promise.all(creating)

    // eslint-disable-next-line @typescript-eslint/promise-function-async
    const connecting = consumers.map((consumer) => consumer.connect())

    await Promise.all(connecting)
    this.depends(consumers)

    console.info('Event sources connected', { count: creating.length })
  }

  public override async close (): Promise<void> {
    console.info('Event sources disconnected')
  }
}

class Events extends Readable {
  public constructor () {
    super({ objectMode: true })
  }

  public override _read (): void {
  }
}

export interface Route {
  event: string
  properties: string[]
}
