import { components } from './components.ts'
import { version } from '../version.ts'
import type { Dependency, Instances, Resources, Service } from '@toa.io/operations'

/** Where Toa's release publishes this service's image. An application takes it
 *  instead of building one when its context says `registry.services: published`. */
export const image = 'ghcr.io/toa-io/extension-realtime-streams'

export const standalone = true

export function deployment(
  instances: Instances<Declaration>,
  annotation?: Declaration & Annotation
): Dependency {
  const routes = []
  const { resources, ...annotatedRoutes } = annotation ?? {}
  const labels = components().labels

  if (annotatedRoutes !== undefined) routes.push(...parse(annotatedRoutes))

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
    image,
    version,
    components: labels,
    resources,
    variables: [
      {
        name: 'TOA_REALTIME',
        value: JSON.stringify(routes)
      }
    ]
  }

  return { services: [service], events: routes.map((route) => route.event) }
}

export function parse(declaration: Declaration): Route[] {
  const routes: Route[] = []

  for (const [event, value] of Object.entries(declaration))
    if (isObject(value)) {
      const properties =
        value.key === undefined ? [] : Array.isArray(value.key) ? value.key : [value.key]
      const route: Route = { event, properties, expose: value.expose }

      if (value.dynamic !== undefined && value.dynamic !== false)
        route.dynamic = value.dynamic === true ? {} : { expose: value.dynamic.expose }

      routes.push(route)
    } else {
      const properties = Array.isArray(value) ? value : [value]

      routes.push({ event, properties })
    }

  return routes
}

function isObject(value: Entry): value is RouteDeclaration {
  return typeof value === 'object' && !Array.isArray(value)
}

export type Entry = string | string[] | RouteDeclaration

export type Declaration = Record<string, Entry>

export interface RouteDeclaration {
  /** Optional where the event is `dynamic`: it is then routed by dynamic routes only. */
  key?: string | string[]
  expose?: string[]
  /** Open to the routes an application creates at runtime, with the most they may expose. */
  dynamic?: boolean | { expose?: string[] }
}

export interface Route {
  event: string
  properties: string[]
  expose?: string[]
  dynamic?: Dynamic
}

export interface Dynamic {
  /** What a dynamic route of the event may expose at most; the whole payload where absent. */
  expose?: string[]
}

interface Annotation {
  resources?: Resources
}
