import { environment } from '@toa.io/definitions/extensions.introspection'
import type { Bounds } from '@toa.io/definitions/extensions.introspection'

/**
 * What a signal of this deployment may ask for, in seconds.
 *
 * It is what every process that hears one holds it to, read from the same annotation, so
 * whoever writes a signal can ask for something that will be carried out as written rather
 * than clamped on arrival. A deployment that does not take halts says nothing about them.
 */
export function computation(): Configuration {
  const options = environment()

  if (options === null) throw new Error('Introspection is not configured in this process')

  if (!options.halt) return {}

  return { halt: { duration: options.duration, quiescence: options.quiescence } }
}

interface Configuration {
  halt?: {
    duration: Bounds
    quiescence: Bounds
  }
}
