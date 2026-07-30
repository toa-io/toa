import { encode } from '@toa.io/generic'
import { components } from './Composition'
import type { Dependency, Instances, Resources, Service } from '@toa.io/operations'

export const standalone = true
export { components } from './Composition'

export function deployment (instances: Instances<Declaration>, annotation?: Declaration & Annotation): Dependency {
  const routes = []
  const { resources, ...annotatedRoutes } = annotation ?? {}
  const labels = components().labels

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
    components: labels,
    resources,
    variables: [{
      name: 'TOA_REALTIME',
      value: encode(routes)
    }]
  }

  return { services: [service] }
}

export function parse (declaration: Declaration): Route[] {
  const routes: Route[] = []

  for (const [event, value] of Object.entries(declaration))
    if (isObject(value)) {
      const properties = Array.isArray(value.key) ? value.key : [value.key]

      routes.push({ event, properties, expose: value.expose })
    } else {
      const properties = Array.isArray(value) ? value : [value]

      routes.push({ event, properties })
    }

  return routes
}

function isObject (value: Entry): value is RouteDeclaration {
  return typeof value === 'object' && !Array.isArray(value)
}

export type Entry = string | string[] | RouteDeclaration

export type Declaration = Record<string, Entry>

export interface RouteDeclaration {
  key: string | string[]
  expose?: string[]
}

export interface Route {
  event: string
  properties: string[]
  expose?: string[]
}

interface Annotation {
  resources?: Resources
}
