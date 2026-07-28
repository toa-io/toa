import { console } from 'openspan'
import { Connector, type Message } from '@toa.io/core'
import type { Readable } from 'node:stream'

export class Receiver extends Connector {
  private readonly event: string
  private readonly properties: string[]
  private readonly expose?: string[]
  private readonly stream: Readable

  public constructor (event: string, properties: string[], stream: Readable, expose?: string[]) {
    super()

    this.event = event
    this.properties = properties
    this.expose = expose
    this.stream = stream
  }

  public receive (message: Message<Record<string, string>>): void {
    const data = this.fit(message.payload)

    for (const property of this.properties) {
      const key = message.payload[property]

      if (key === undefined) {
        console.debug('Event does not contain key property',
          { property, event: this.event })

        continue
      }

      if (Array.isArray(key))
        // eslint-disable-next-line max-depth
        for (const k of key as string[])
          this.push(k, data)
      else
        this.push(key, data)
    }
  }

  private fit (payload: Record<string, string>): Record<string, string> {
    if (this.expose === undefined)
      return payload

    const entries = Object.entries(payload)
      .filter(([key]) => this.expose!.includes(key))

    return Object.fromEntries(entries)
  }

  private push (key: string | null, data: Record<string, string>): void {
    if (key === null || typeof key === 'undefined') {
      console.debug('Key is null or undefined, skipping', { key, event: this.event })

      return
    }

    console.debug('Pushing event to stream', { key, event: this.event, data })

    this.stream.push({ key, event: this.event, data })
  }
}
