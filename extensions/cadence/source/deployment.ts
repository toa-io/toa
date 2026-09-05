import { readFileSync } from 'node:fs'
import { components } from './Composition.js'
import { DISCRETENESS, NAMESPACE } from './const.js'
import * as schemas from './schemas.js'
import type { Annotation } from './types.js'
import type { Dependency, Service, Variable } from '@toa.io/operations'

/**
 * The component that keeps delayed calls runs in a service of its own, the way the identity
 * components run in the gateway. A composition may claim it and run it in its own pods instead.
 */
export function deployment (_: unknown, annotation?: Annotation | null): Dependency {
  schemas.annotation.validate<Annotation | null>(annotation ?? null, 'Invalid cadence annotation')

  // stated in seconds and carried in milliseconds, so that what an application writes is what
  // the rest of a manifest is written in
  const discreteness = (annotation?.discreteness ?? DISCRETENESS) * 1000
  const variables: Variable[] =
    [{ name: 'TOA_CADENCE_DISCRETENESS', value: String(discreteness) }]

  const service: Service = {
    group: NAMESPACE,
    name: 'metronome',
    version: JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version,
    components: components().labels,
    variables
  }

  return { services: [service] }
}

/** The extension is deployed for the sake of `delay`, which nothing has to declare to use. */
export const standalone = true
