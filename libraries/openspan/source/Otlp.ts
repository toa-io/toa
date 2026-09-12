import { console } from './Console.ts'
import { Transport } from './Transport.ts'
import type { Kind } from './Console.ts'
import type { Exporter, Span } from './exporters.ts'

/**
 * Exports spans to an OTLP/HTTP endpoint (JSON encoding).
 *
 * Spans are batched and flushed when the batch is full or on an interval,
 * and on `beforeExit`.
 *
 * The exporter is tolerant to an absent or unavailable endpoint: a request is bounded by
 * a timeout, a failed batch is dropped, and the exporter suspends itself for a cooldown
 * period, dropping spans instead of queueing them. A single warning is logged per outage,
 * so that neither the process lifecycle nor the log is affected by the missing infrastructure.
 */
export class Otlp implements Exporter {
  private readonly transport: Transport
  private readonly service: string
  private queue: Span[] = []
  private timer: NodeJS.Timeout | null = null
  private sending: Promise<void> | null = null

  public constructor(options: OtlpOptions) {
    this.transport = new Transport(options.endpoint.replace(/\/$/, '') + '/v1/traces', {
      ...options,
      subject: 'spans'
    })

    this.service = options.service ?? process.env.TOA_CONTEXT ?? 'toa'

    process.once('beforeExit', () => void this.flush())
  }

  public export(span: Span): void {
    if (this.transport.suspended) return

    if (this.queue.length >= QUEUE) this.queue.shift() // drop the oldest

    this.queue.push(span)

    if (this.queue.length >= BATCH) void this.flush()
    else this.timer ??= setTimeout(() => void this.flush(), INTERVAL).unref()
  }

  /**
   * Never rejects and is bounded by a single request timeout: an unavailable endpoint
   * suspends the exporter, dropping whatever is left in the queue.
   */
  public async flush(): Promise<void> {
    if (this.timer !== null) {
      clearTimeout(this.timer)
      this.timer = null
    }

    this.sending ??= this.send().finally(() => (this.sending = null))

    await this.sending
  }

  private async send(): Promise<void> {
    while (this.queue.length > 0) {
      if (this.transport.suspended) {
        this.queue = []

        return
      }

      await this.post(this.queue.splice(0, BATCH))
    }
  }

  // never rejects, as a rejection would break the `sending` chain and crash the process
  private async post(spans: Span[]): Promise<void> {
    let body: string

    try {
      body = JSON.stringify(this.request(spans))
    } catch (error) {
      // a malformed span must not disable the exporter
      console.warn('OTLP span serialization failed', error as Error)

      return
    }

    // what is left behind an outage is dropped rather than held
    if (!(await this.transport.send(body, { spans: spans.length }))) this.queue = []
  }

  private request(spans: Span[]): object {
    const services = new Map<string, Span[]>()

    for (const span of spans) {
      const service = span.service ?? this.service
      const group = services.get(service)

      if (group === undefined) services.set(service, [span])
      else group.push(span)
    }

    return {
      resourceSpans: Array.from(services, ([service, spans]) => ({
        resource: {
          attributes: attributes({ 'service.name': service })
        },
        scopeSpans: [
          {
            scope: { name: 'openspan' },
            spans: spans.map((span) => this.span(span))
          }
        ]
      }))
    }
  }

  private span(span: Span): object {
    return {
      traceId: span.traceId,
      spanId: span.spanId,
      ...(span.parentId === undefined ? {} : { parentSpanId: span.parentId }),
      name: span.name,
      kind: KINDS[span.kind],
      startTimeUnixNano: (BigInt(span.time) * 1_000_000n).toString(),
      endTimeUnixNano: (
        BigInt(span.time) * 1_000_000n +
        BigInt(Math.round(span.duration * 1_000_000))
      ).toString(),
      attributes: attributes({ ...span.scope, ...span.attributes }),
      status: span.status === 'error' ? { code: 2 } : {}
    }
  }
}

export function attributes(values: Record<string, unknown>): object[] {
  return Object.entries(values)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => ({ key, value: attribute(value) }))
}

function attribute(value: unknown): object {
  switch (typeof value) {
    case 'string':
      return { stringValue: value }
    case 'boolean':
      return { boolValue: value }
    case 'number':
      return Number.isInteger(value)
        ? { intValue: value.toString() }
        : { doubleValue: value }
    default:
      return { stringValue: JSON.stringify(value) }
  }
}

export interface OtlpOptions {
  endpoint: string
  headers?: Record<string, string>
  service?: string

  /** Request timeout in milliseconds, bounds how long a shutdown can wait for the endpoint. */
  timeout?: number

  /** Milliseconds to drop spans for after a failed export, before trying the endpoint again. */
  cooldown?: number
}

// https://opentelemetry.io/docs/specs/otlp/#otlphttp
const KINDS: Record<Kind, number> = {
  internal: 1,
  server: 2,
  client: 3,
  producer: 4,
  consumer: 5
}

const BATCH = 512
const QUEUE = 2048
const INTERVAL = 5000
