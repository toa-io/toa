/**
 * A realtime route: an event of a component, the properties of its payload that are the keys of
 * the streams it goes to, and what of it they are given.
 */
export interface Route {
  /** the event's label within its component */
  event: string
  properties: string[]
  expose: string[]
}

/** A component's `realtime` declaration, by event label. */
export type Declaration = Record<string, RouteDeclaration>

export interface RouteDeclaration {
  key: string | string[]

  /** What the streams are given of the event. Required: nothing is given that is not named. */
  expose: string[]
}

export function parse(declaration: Declaration): Route[] {
  return Object.entries(declaration).map(([event, { key, expose }]) => ({
    event,
    properties: Array.isArray(key) ? key : [key],
    expose
  }))
}
