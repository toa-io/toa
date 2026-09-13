import { console } from './Console.ts'
import { Transport } from './Transport.ts'
import { attributes } from './Otlp.ts'
import type { Entry, Severity } from './Console.ts'
import type { LogExporter } from './sinks.ts'

/**
 * Exports log entries to an OTLP/HTTP endpoint (JSON encoding).
 *
 * Entries are batched and flushed when the batch is full or on an interval, and on `beforeExit`.
 *
 * The exporter is tolerant to an absent or unavailable endpoint on the same terms as the span
 * exporter: a request is bounded by a timeout, a failed batch is dropped, and the exporter
 * suspends itself for a cooldown period, dropping entries instead of queueing them. A single
 * warning is logged per outage — and that warning is an entry of its own, which is why every
 * path here drops what it holds while the endpoint is away rather than growing a queue of
 * reports about the endpoint being away.
 */
export class OtlpLogs implements LogExporter {
  private readonly transport: Transport
  private readonly resource: object[]
  private queue: Entry[] = []
  private timer: NodeJS.Timeout | null = null
  private sending: Promise<void> | null = null

  public constructor(options: OtlpLogsOptions) {
    this.transport = new Transport(options.endpoint.replace(/\/$/, '') + '/v1/logs', {
      ...options,
      subject: 'entries'
    })

    this.resource = attributes({
      'service.name': process.env.TOA_CONTEXT ?? 'toa',
      ...options.resource
    })

    process.once('beforeExit', () => void this.flush())
  }

  public export(entry: Entry): void {
    if (this.transport.suspended) return

    if (this.queue.length >= QUEUE) this.queue.shift() // drop the oldest

    this.queue.push(entry)

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

      // taken out of the queue before it is serialized: what fails to serialize is reported by
      // an entry, which arrives here, and a batch left behind would be retried against itself
      await this.post(this.queue.splice(0, BATCH))
    }
  }

  // never rejects, as a rejection would break the `sending` chain and crash the process
  private async post(entries: Entry[]): Promise<void> {
    let body: string

    try {
      body = JSON.stringify(this.request(entries))
    } catch (error) {
      // a malformed entry must not disable the exporter
      console.warn('OTLP log serialization failed', error as Error)

      return
    }

    // what is left behind an outage is dropped rather than held
    if (!(await this.transport.send(body, { entries: entries.length }))) this.queue = []
  }

  private request(entries: Entry[]): object {
    return {
      resourceLogs: [
        {
          resource: { attributes: this.resource },
          scopeLogs: [
            {
              scope: { name: 'openspan' },
              logRecords: entries.map((entry) => this.record(entry))
            }
          ]
        }
      ]
    }
  }

  private record(entry: Entry): object {
    const { time, severity, message, attributes: values, context, ...rest } = entry

    return {
      timeUnixNano: (BigInt(Date.parse(time)) * 1_000_000n).toString(),
      severityNumber: SEVERITIES[severity],
      severityText: severity,
      body: { stringValue: message },
      ...(rest.trace_id === undefined ? {} : { traceId: rest.trace_id }),
      ...(rest.span_id === undefined ? {} : { spanId: rest.span_id }),

      // `trace_id` and `span_id` are attributes as well as fields: a backend indexes the fields
      // as it chooses, and a query that links a record to its trace needs them under a name
      attributes: attributes({ ...values, ...context, ...rest })
    }
  }
}

export interface OtlpLogsOptions {
  endpoint: string
  headers?: Record<string, string>

  /** resource attributes, `service.name` among them */
  resource?: Record<string, string | undefined>

  /** Request timeout in milliseconds, bounds how long a shutdown can wait for the endpoint. */
  timeout?: number

  /** Milliseconds to drop entries for after a failed export, before trying the endpoint again. */
  cooldown?: number
}

// https://opentelemetry.io/docs/specs/otel/logs/data-model/#field-severitynumber
const SEVERITIES: Record<Severity, number> = {
  TRACE: 1,
  DEBUG: 5,
  INFO: 9,
  WARN: 13,
  ERROR: 17
}

const BATCH = 512
const QUEUE = 2048
const INTERVAL = 5000
