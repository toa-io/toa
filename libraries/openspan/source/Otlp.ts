import { console } from './Console'
import type { Kind } from './Console'
import type { Exporter, Span } from './exporters'

/**
 * Exports spans to an OTLP/HTTP endpoint (JSON encoding).
 *
 * Spans are batched and flushed when the batch is full or on an interval,
 * and on `beforeExit`. On failure the batch is dropped with a warning.
 */
export class Otlp implements Exporter {
  private readonly url: string
  private readonly headers: Record<string, string>
  private readonly service: string
  private queue: Span[] = []
  private timer: NodeJS.Timeout | null = null
  private pending: Promise<void> = Promise.resolve()

  public constructor (options: OtlpOptions) {
    this.url = options.endpoint.replace(/\/$/, '') + '/v1/traces'
    this.headers = { 'content-type': 'application/json', ...options.headers }
    this.service = options.service ?? process.env.TOA_CONTEXT ?? 'toa'

    process.once('beforeExit', () => void this.flush())
  }

  public export (span: Span): void {
    if (this.queue.length >= QUEUE)
      this.queue.shift() // drop the oldest

    this.queue.push(span)

    if (this.queue.length >= BATCH)
      void this.flush()
    else
      this.timer ??= setTimeout(() => void this.flush(), INTERVAL).unref()
  }

  public async flush (): Promise<void> {
    if (this.timer !== null) {
      clearTimeout(this.timer)
      this.timer = null
    }

    if (this.queue.length === 0)
      return await this.pending

    const spans = this.queue

    this.queue = []

    this.pending = this.pending.then(async () => {
      await this.post(spans)
    })

    return await this.pending
  }

  // never rejects, as a rejection would break the `pending` chain and crash the process
  private async post (spans: Span[]): Promise<void> {
    try {
      const body = JSON.stringify(this.request(spans))
      const response = await fetch(this.url, { method: 'POST', headers: this.headers, body })

      if (!response.ok)
        console.warn('OTLP export rejected', { status: response.status, spans: spans.length })
    } catch (error) {
      console.warn('OTLP export failed', error as Error)
    }
  }

  private request (spans: Span[]): object {
    const services = new Map<string, Span[]>()

    for (const span of spans) {
      const service = span.service ?? this.service
      const group = services.get(service)

      if (group === undefined)
        services.set(service, [span])
      else
        group.push(span)
    }

    return {
      resourceSpans: Array.from(services, ([service, spans]) => ({
        resource: {
          attributes: attributes({ 'service.name': service })
        },
        scopeSpans: [{
          scope: { name: 'openspan' },
          spans: spans.map((span) => this.span(span))
        }]
      }))
    }
  }

  private span (span: Span): object {
    return {
      traceId: span.traceId,
      spanId: span.spanId,
      ...span.parentId === undefined ? {} : { parentSpanId: span.parentId },
      name: span.name,
      kind: KINDS[span.kind],
      startTimeUnixNano: (BigInt(span.time) * 1_000_000n).toString(),
      endTimeUnixNano: (BigInt(span.time) * 1_000_000n +
        BigInt(Math.round(span.duration * 1_000_000))).toString(),
      attributes: attributes({ ...span.scope, ...span.attributes }),
      status: span.status === 'error' ? { code: 2 } : {}
    }
  }
}

function attributes (values: Record<string, unknown>): object[] {
  return Object.entries(values)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => ({ key, value: attribute(value) }))
}

function attribute (value: unknown): object {
  switch (typeof value) {
    case 'string': return { stringValue: value }
    case 'boolean': return { boolValue: value }
    case 'number':
      return Number.isInteger(value)
        ? { intValue: value.toString() }
        : { doubleValue: value }
    default: return { stringValue: JSON.stringify(value) }
  }
}

export interface OtlpOptions {
  endpoint: string
  headers?: Record<string, string>
  service?: string
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
