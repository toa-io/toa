import { components } from './components.ts'
import { version } from '../version.ts'
import { COMPONENT, NAMESPACE } from './const.ts'
import type { Dependency, Service } from '@toa.io/operations'

/**
 * The component that keeps the runs is a service of its own, as cadence's metronome is. A
 * composition may claim it and run it in its own pods instead.
 */
export function deployment(): Dependency {
  const service: Service = {
    group: NAMESPACE,
    name: COMPONENT,
    version,
    components: components().labels
  }

  return { services: [service] }
}
