import { components } from './Composition'
import type { Dependency, Service } from '@toa.io/operations'

export function deployment (): Dependency {
  const labels = components().labels

  const service: Service = {
    group: 'mail',
    name: 'agent',
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    version: require('../package.json').version,
    variables: [],
    components: labels
  }

  return { services: [service] }
}
