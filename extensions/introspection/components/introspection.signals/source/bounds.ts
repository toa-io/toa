import { environment } from '@toa.io/definitions/extensions.introspection'
import type { Bounds } from '@toa.io/definitions/extensions.introspection'

/**
 * What a halt of this deployment may ask for, in seconds.
 *
 * It is what every process that hears a signal holds it to, read from the same annotation, so
 * whoever writes a halt can ask for something that will be carried out as written rather than
 * clamped on arrival.
 */
export function computation(): Limits {
  const options = environment()

  if (options === null) throw new Error('Introspection is not configured in this process')

  return { duration: options.duration, quiescence: options.quiescence }
}

interface Limits {
  duration: Bounds
  quiescence: Bounds
}
