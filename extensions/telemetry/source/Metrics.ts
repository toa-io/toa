import { registry } from 'openspan'
import { Connector, exceptions } from '@toa.io/core'
import type { Counter, Gauge, Histogram, Labels } from 'openspan'
import type { Locator } from '@toa.io/core'
import type { extensions } from '@toa.io/core/types'
import type { Declaration, Instrument } from '@toa.io/definitions/extensions.telemetry'

/**
 * The instruments a component declared, by the name it declared them under.
 *
 * Built at construction rather than per call, and named after the component: two components that
 * both declare `conversions` mean two different things by it, and one series name would merge
 * them into one series of two meanings.
 */
export class Metrics extends Connector implements extensions.Aspect {
  public readonly name = 'metrics'

  private readonly instruments: Instruments

  public constructor(locator: Locator, declaration: Declaration) {
    super()

    this.instruments = guard(create(locator, declaration))
  }

  public invoke(): Instruments {
    return this.instruments
  }
}

/**
 * A name the manifest does not declare raises rather than answering `undefined`. It is a literal
 * in the source, so it is wrong on every invocation of that path and on every retry — and
 * `Misuse` is classified permanent, so where nobody is waiting the message is parked on its first
 * delivery instead of being tried again for minutes.
 *
 * What is asked of every object rather than of this one answers `undefined`: a symbol, anything
 * `Object.prototype` has, and the two names a language protocol reads — `then`, which would make
 * awaiting this object raise, and `toJSON`, which would make logging it raise. None of them is a
 * metric anybody meant to declare.
 */
function guard(instruments: Record<string, Recorder>): Instruments {
  return new Proxy(instruments, {
    get(target, property) {
      if (typeof property === 'symbol') return undefined

      const instrument = target[property]

      if (instrument !== undefined) return instrument

      if (property in Object.prototype || PROTOCOL.has(property)) return undefined

      throw new exceptions.MisuseException(`Metric '${property}' is not declared`)
    }
  }) as Instruments
}

const PROTOCOL = new Set(['then', 'toJSON'])

function create(locator: Locator, declaration: Declaration): Record<string, Recorder> {
  const meters = registry()
  const instruments: Record<string, Recorder> = {}

  for (const [name, instrument] of Object.entries(declaration.metrics ?? {})) {
    const series = `${locator.id}.${name}`
    const labels = keys(instrument)

    if (instrument.type === 'histogram')
      instruments[name] = meters.histogram(series, options(instrument), labels)
    else if (instrument.type === 'gauge') instruments[name] = meters.gauge(series, labels)
    else instruments[name] = meters.counter(series, labels)
  }

  return instruments
}

function options(instrument: Instrument): { buckets: number[]; unit?: string } {
  const declared: { buckets: number[]; unit?: string } = { buckets: instrument.buckets! }

  if (instrument.unit !== undefined) declared.unit = instrument.unit

  return declared
}

/** A label value travels as a string, because that is what a label is. */
function keys(instrument: Instrument): Labels {
  const labels: Labels = {}

  for (const [key, values] of Object.entries(instrument.labels ?? {}))
    labels[key] = values === null ? null : values.map(String)

  return labels
}

type Recorder = Counter | Gauge | Histogram
type Instruments = Record<string, Recorder>
