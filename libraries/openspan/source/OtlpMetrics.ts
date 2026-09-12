import { hostname } from 'node:os'
import { console } from './Console.ts'
import { Transport } from './Transport.ts'
import { attributes } from './Otlp.ts'
import type { Meter } from './meters.ts'
import type { Series } from './Registry.ts'

/**
 * Exports series to an OTLP/HTTP endpoint (JSON encoding).
 *
 * A collection is one request: the whole cumulative state of the process, which is what makes a
 * lost export cost nothing but resolution — the next one carries the totals the lost one would
 * have. There is no queue for the same reason, and no batching: what would be batched is the
 * state that the following collection replaces.
 *
 * Cumulative temporality with one start time for the life of the process. A start time that moved
 * would tell the backend the counter had restarted, and every rate would show a reset that never
 * happened.
 */
export class OtlpMetrics implements Meter {
  private readonly transport: Transport
  private readonly resource: object[]
  private readonly start = BigInt(Date.now()) * 1_000_000n
  private sending: Promise<void> | null = null
  private pending: Series[] | null = null

  public constructor(options: OtlpMetricsOptions) {
    this.transport = new Transport(options.endpoint.replace(/\/$/, '') + '/v1/metrics', {
      ...options,
      subject: 'series'
    })

    this.resource = attributes({
      'service.name': process.env.TOA_CONTEXT ?? 'toa',

      // a replica that shares its identity with another shares its counters, and both appear
      // to reset whenever the backend reads the other one
      'service.instance.id': `${hostname()}:${process.pid}`,
      ...options.resource
    })

    process.once('beforeExit', () => void this.flush())
  }

  public export(series: Series[]): void {
    if (series.length === 0 || this.transport.suspended) return

    // a collection that arrives while one is in flight replaces it: they are the same totals
    this.pending = series
  }

  /** Never rejects and is bounded by a single request timeout. */
  public async flush(): Promise<void> {
    this.sending ??= this.send().finally(() => (this.sending = null))

    await this.sending
  }

  private async send(): Promise<void> {
    const series = this.pending

    this.pending = null

    if (series === null || this.transport.suspended) return

    let body: string

    try {
      body = JSON.stringify(this.request(series))
    } catch (error) {
      // a malformed series must not disable the exporter
      console.warn('OTLP metrics serialization failed', error as Error)

      return
    }

    await this.transport.send(body, { series: series.length })
  }

  private request(series: Series[]): object {
    const time = (BigInt(Date.now()) * 1_000_000n).toString()
    const metrics = new Map<string, Series[]>()

    for (const one of series) {
      const group = metrics.get(one.name)

      if (group === undefined) metrics.set(one.name, [one])
      else group.push(one)
    }

    return {
      resourceMetrics: [
        {
          resource: { attributes: this.resource },
          scopeMetrics: [
            {
              scope: { name: 'openspan' },
              metrics: Array.from(metrics.values(), (group) => this.metric(group, time))
            }
          ]
        }
      ]
    }
  }

  private metric(group: Series[], time: string): object {
    const [first] = group
    const unit = first.unit === undefined ? {} : { unit: first.unit }
    const dataPoints = group.map((series) => this.point(series, time))

    switch (first.type) {
      case 'counter':
        return {
          name: first.name,
          ...unit,
          sum: { aggregationTemporality: CUMULATIVE, isMonotonic: true, dataPoints }
        }
      case 'gauge':
        return { name: first.name, ...unit, gauge: { dataPoints } }
      case 'histogram':
        return {
          name: first.name,
          ...unit,
          histogram: { aggregationTemporality: CUMULATIVE, dataPoints }
        }
    }
  }

  private point(series: Series, time: string): object {
    const point = {
      attributes: attributes(series.labels),
      startTimeUnixNano: this.start.toString(),
      timeUnixNano: time
    }

    if (series.type === 'histogram')
      return {
        ...point,
        count: String(series.count),
        sum: series.sum,

        // uint64 travels as a string in OTLP JSON
        bucketCounts: series.buckets!.map(String),
        explicitBounds: series.bounds
      }

    return { ...point, asDouble: series.value }
  }
}

export interface OtlpMetricsOptions {
  endpoint: string
  headers?: Record<string, string>

  /** resource attributes, `service.name` and `service.instance.id` among them */
  resource?: Record<string, string | undefined>

  /** Request timeout in milliseconds, bounds how long a shutdown can wait for the endpoint. */
  timeout?: number

  /** Milliseconds to drop series for after a failed export, before trying the endpoint again. */
  cooldown?: number
}

// https://opentelemetry.io/docs/specs/otlp/#otlphttp
const CUMULATIVE = 2
