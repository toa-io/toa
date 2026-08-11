import { console, decode, run } from 'openspan'
import { Connector, type Message } from '@toa.io/core'
import type { SpanContext } from 'openspan'
import type { Readable } from 'node:stream'

export class Receiver extends Connector {
  private readonly event: string
  private readonly properties: string[]
  private readonly expose?: string[]
  private readonly stream: Readable

  public constructor ({ event, properties, stream, expose }: {
    event: string
    properties: string[]
    stream: Readable
    expose?: string[]
  }) {
    super()

    this.event = event
    this.properties = properties
    this.expose = expose
    this.stream = stream
  }

  public receive (message: Message<Record<string, string>>): void {
    // the push continues the trace from the producer
    const telemetry = message.telemetry === undefined ? null : decode(message.telemetry)

    if (telemetry === null)
      this.process(message, telemetry)
    else
      run(telemetry, () => this.process(message, telemetry))
  }

  private process (message: Message<Record<string, string>>, telemetry: SpanContext | null): void {
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
          this.push(k, data, telemetry)
      else
        this.push(key, data, telemetry)
    }
  }

  private fit (payload: Record<string, string>): Record<string, string> {
    if (this.expose === undefined)
      return payload

    const entries = Object.entries(payload)
      .filter(([key]) => this.expose!.includes(key))

    return Object.fromEntries(entries)
  }

  private push (key: string | null, data: Record<string, string>, telemetry: SpanContext | null): void {
    if (key === null || typeof key === 'undefined') {
      console.debug('Key is null or undefined, skipping', { key, event: this.event })

      return
    }

    console.debug('Pushing event to stream', { key, event: this.event, data })

    this.stream.push({ key, event: this.event, data, telemetry } satisfies Push)
  }
}

export interface Push {
  key: string
  event: string
  data: Record<string, string>
  telemetry: SpanContext | null
}
