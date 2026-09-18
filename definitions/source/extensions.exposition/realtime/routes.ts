/**
 * A realtime route: an event of a component, the properties of its payload that are the keys of
 * the streams it goes to, and what of it they are given.
 */
export interface Route {
  /** the event's label within its component */
  event: string
  properties: string[]
  expose?: string[]
}

export type Entry = string | string[] | RouteDeclaration

/** A component's `realtime` declaration, by event label. */
export type Declaration = Record<string, Entry>

export interface RouteDeclaration {
  key: string | string[]
  expose?: string[]
}

export function parse(declaration: Declaration): Route[] {
  const routes: Route[] = []

  for (const [event, value] of Object.entries(declaration))
    if (isObject(value)) {
      const route: Route = { event, properties: list(value.key) }

      if (value.expose !== undefined) route.expose = value.expose

      routes.push(route)
    } else routes.push({ event, properties: list(value) })

  return routes
}

function list(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value]
}

function isObject(value: Entry): value is RouteDeclaration {
  return typeof value === 'object' && !Array.isArray(value)
}
