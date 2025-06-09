import { basename } from 'node:path'
import { encode } from '@toa.io/generic'
import { find } from './Composition'
import type { Dependency, Instances, Resources, Service } from '@toa.io/operations'

export const standalone = true

export function deployment (instances: Instances<Declaration>, annotation?: Declaration & Annotation): Dependency {
  const routes = []

  const { resources, ...annotatedRoutes } = annotation ?? {}

  if (annotatedRoutes !== undefined)
    routes.push(...parse(annotatedRoutes))

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

    version: require('../package.json').version,
    components: labels(),
    resources,
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

interface Annotation {
  resources?: Resources
}
