import { console } from './Console.ts'

/**
 * The instruments of one process and what they hold.
 *
 * Cumulative: a counter and a histogram only ever grow, from the moment the process started, and
 * a collection reads them rather than draining them. What a backend wants is the total, and a
 * total that survives a lost export is a total a restart is the only thing that resets.
 *
 * An instrument declares its label keys once, and where a key enumerates its values it admits
 * nothing else. That is the whole of the cardinality contract: how many series this process can
 * produce is known before it produces any.
 */
export class Registry {
  readonly #instruments: Instrument[] = []
  readonly #observers: Array<() => void> = []

  public counter(name: string, labels?: Labels): Counter {
    return this.#add(new Counter(name, labels))
  }

  public gauge(name: string, labels?: Labels): Gauge {
    return this.#add(new Gauge(name, labels))
  }

  public histogram(name: string, options: HistogramOptions, labels?: Labels): Histogram {
    return this.#add(new Histogram(name, options, labels))
  }

  /**
   * Runs `fn` before every collection. What a process knows at any moment — its memory, what it
   * holds in flight — is read here rather than written on a path that would then have to care.
   */
  public observe(fn: () => void): void {
    this.#observers.push(fn)
  }

  public collect(): Series[] {
    for (const observer of this.#observers) observer()

    return this.#instruments.flatMap((instrument) => instrument.series())
  }

  #add<T extends Instrument>(instrument: T): T {
    this.#instruments.push(instrument)

    return instrument
  }
}

abstract class Instrument {
  public readonly name: string
  readonly #keys: string[]
  readonly #values: Array<string[] | null>

  /** whether an unenumerated value has already been reported for that key */
  readonly #reported: boolean[]

  public constructor(name: string, labels: Labels = {}) {
    this.name = name
    this.#keys = Object.keys(labels)
    this.#values = this.#keys.map((key) => labels[key])
    this.#reported = this.#keys.map(() => false)
  }

  public abstract series(): Series[]

  /**
   * The key a point is held under, and the labels it is reported with.
   *
   * A value the declaration does not enumerate becomes `UNDECLARED` rather than a series of its
   * own: the values come from data, and the data is what the enumeration exists to keep out of
   * the cardinality. It is said once per key and not once per value — remembering which values
   * have been refused would be that same unbounded set, held in memory instead.
   */
  protected resolve(labels: Record<string, unknown> = {}): Resolved {
    const values: Record<string, string> = {}
    let key = ''

    for (let i = 0; i < this.#keys.length; i++) {
      const name = this.#keys[i]
      const admitted = this.#values[i]
      const given = labels[name]
      let value = given === undefined ? UNDECLARED : String(given)

      if (admitted !== null && !admitted.includes(value)) {
        if (!this.#reported[i]) {
          this.#reported[i] = true

          console.warn('Metric label value is not declared', {
            metric: this.name,
            label: name,
            value
          })
        }

        value = UNDECLARED
      }

      values[name] = value
      key += value + ' '
    }

    return { key, labels: values }
  }
}

export class Counter extends Instrument {
  readonly #points = new Map<string, Point<number>>()

  public add(value = 1, labels?: Record<string, unknown>): void {
    const { key, labels: resolved } = this.resolve(labels)
    const point = this.#points.get(key)

    if (point === undefined) this.#points.set(key, { labels: resolved, value })
    else point.value += value
  }

  public series(): Series[] {
    return Array.from(this.#points.values(), (point) => ({
      name: this.name,
      type: 'counter' as const,
      labels: point.labels,
      value: point.value
    }))
  }
}

export class Gauge extends Instrument {
  readonly #points = new Map<string, Point<number>>()

  public set(value: number, labels?: Record<string, unknown>): void {
    const { key, labels: resolved } = this.resolve(labels)
    const point = this.#points.get(key)

    if (point === undefined) this.#points.set(key, { labels: resolved, value })
    else point.value = value
  }

  /** For a level whoever holds it knows only the changes to: one in flight, one no longer. */
  public add(delta: number, labels?: Record<string, unknown>): void {
    const { key, labels: resolved } = this.resolve(labels)
    const point = this.#points.get(key)

    if (point === undefined) this.#points.set(key, { labels: resolved, value: delta })
    else point.value += delta
  }

  public series(): Series[] {
    return Array.from(this.#points.values(), (point) => ({
      name: this.name,
      type: 'gauge' as const,
      labels: point.labels,
      value: point.value
    }))
  }
}

export class Histogram extends Instrument {
  readonly #bounds: number[]
  readonly #unit?: string
  readonly #points = new Map<string, Point<Distribution>>()

  public constructor(name: string, options: HistogramOptions, labels?: Labels) {
    super(name, labels)

    this.#bounds = options.buckets

    if (options.unit !== undefined) this.#unit = options.unit
  }

  public record(value: number, labels?: Record<string, unknown>): void {
    const { key, labels: resolved } = this.resolve(labels)
    let point = this.#points.get(key)

    if (point === undefined) {
      point = {
        labels: resolved,
        value: {
          count: 0,
          sum: 0,
          buckets: new Array<number>(this.#bounds.length + 1).fill(0)
        }
      }

      this.#points.set(key, point)
    }

    point.value.count++
    point.value.sum += value
    point.value.buckets[this.#bucket(value)]++
  }

  public series(): Series[] {
    return Array.from(this.#points.values(), (point) => {
      const series: Series = {
        name: this.name,
        type: 'histogram' as const,
        labels: point.labels,
        bounds: this.#bounds,
        buckets: point.value.buckets,
        count: point.value.count,
        sum: point.value.sum
      }

      if (this.#unit !== undefined) series.unit = this.#unit

      return series
    })
  }

  /** The first bucket whose upper bound the value does not exceed; the last holds the rest. */
  #bucket(value: number): number {
    for (let i = 0; i < this.#bounds.length; i++) if (value <= this.#bounds[i]) return i

    return this.#bounds.length
  }
}

/** What a value outside a label's enumeration, or one the caller did not give, is recorded as. */
export const UNDECLARED = 'UNDECLARED'

interface Point<T> {
  labels: Record<string, string>
  value: T
}

interface Distribution {
  count: number
  sum: number
  buckets: number[]
}

interface Resolved {
  key: string
  labels: Record<string, string>
}

/** Label keys, each with the values it admits, or `null` where it admits any. */
export type Labels = Record<string, string[] | null>

export interface HistogramOptions {
  /** bucket upper bounds, ascending; the implicit last bucket holds everything above them */
  buckets: number[]
  unit?: string
}

export interface Series {
  name: string
  type: 'counter' | 'gauge' | 'histogram'
  labels: Record<string, string>
  unit?: string

  /** counter and gauge */
  value?: number

  /** histogram */
  bounds?: number[]
  buckets?: number[]
  count?: number
  sum?: number
}
