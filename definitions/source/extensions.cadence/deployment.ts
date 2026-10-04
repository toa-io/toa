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

  const service: Service = {
    group: NAMESPACE,
    name: 'metronome',
    version,
    components: components().labels,
    variables
  }

  // absent, a deployment makes the calls of the region it is deployed as, which is what one
  // that has never heard of regions does anyway
  if (annotation?.regions === undefined) return { services: [service] }

  const regions: Variable = { name: REGIONS, value: annotation.regions.join(' ') }

  variables.push(regions)

  /*
   * Every composition is given it as well as the metronome: a pulse and a schedule that name a
   * region are made by the components that declare them, and the region that takes over the
   * delayed calls of one that is gone has to take those over with them.
   */
  return { services: [service], variables: { global: [regions] } }
}

/** The extension is deployed for the sake of `delay`, which nothing has to declare to use. */
export const standalone = true
