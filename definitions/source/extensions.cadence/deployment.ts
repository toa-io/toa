import { components } from './components.ts'
import { version } from '../version.ts'
import { DISCRETENESS, NAMESPACE, REGIONS } from './const.ts'
import * as schemas from './schemas.ts'
import type { Annotation } from './types.ts'
import type { Dependency, Service, Variable } from '@toa.io/operations'

/**
 * The component that keeps delayed calls runs in a service of its own, the way the identity
 * components run in the gateway. A composition may claim it and run it in its own pods instead.
 */
export function deployment(_: unknown, annotation?: Annotation | null): Dependency {
  schemas.annotation.validate<Annotation | null>(
    annotation ?? null,
    'Invalid cadence annotation'
  )

  // stated in seconds and carried in milliseconds, so that what an application writes is what
  // the rest of a manifest is written in
  const discreteness = (annotation?.discreteness ?? DISCRETENESS) * 1000
  const variables: Variable[] = [
    { name: 'TOA_CADENCE_DISCRETENESS', value: String(discreteness) }
  ]

  // absent, the metronome makes the calls of the region it is deployed as, which is what a
  // deployment that has never heard of regions does anyway
  if (annotation?.regions !== undefined)
    variables.push({ name: REGIONS, value: annotation.regions.join(' ') })

  const service: Service = {
    group: NAMESPACE,
    name: 'metronome',
    version,
    components: components().labels,
    variables
  }

  return { services: [service] }
}

/** The extension is deployed for the sake of `delay`, which nothing has to declare to use. */
export const standalone = true
