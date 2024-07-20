import { basename } from 'node:path'
import { encode } from '@toa.io/generic'
import { find } from './Composition'
import type { Dependency, Instances, Service } from '@toa.io/operations'

export const standalone = true

export function deployment (instances: Instances<Declaration>, annotation?: Declaration): Dependency {
  const routes = []

  if (annotation !== undefined)
    routes.push(...parse(annotation))

  for (const instance of instances) {
    const completed: Declaration = {}

    for (const [key, value] of Object.entries(instance.manifest)) {
      const event = instance.locator.id + '.' + key

      completed[event] = value
    }

    routes.push(...parse(completed))
  }

  const service: Service = {
    group: 'realtime',
    name: 'streams',
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    version: require('../package.json').version,
    components: labels(),
    variables: [{
      name: 'TOA_REALTIME',
      value: encode(routes)
    }]
  }

  return { services: [service] }
}

function parse (declaration: Declaration): Route[] {
  const routes: Route[] = []

  for (const [event, value] of Object.entries(declaration)) {
    const properties = Array.isArray(value) ? value : [value]

    routes.push({ event, properties })
  }

  return routes
}

function labels (): string[] {
  return find().map((path) => 'realtime-' + basename(path))
}

type Declaration = Record<string, string | string[]>

interface Route {
  event: string
  properties: string[]
}
