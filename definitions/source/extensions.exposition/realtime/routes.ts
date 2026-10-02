/**
 * A realtime route: an event of a component, the properties of its payload that are the keys of
 * the streams it goes to, the literal keys it goes to whatever its payload, and what of it they
 * are given.
 */
export interface Route {
  /** the event's label within its component */
  event: string
  properties: string[]

  /** keys as they are, `~` included */
  literals: string[]
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
  return Object.entries(declaration).map(([event, { key, expose }]) => {
    const keys = Array.isArray(key) ? key : [key]

    return {
      event,
      properties: keys.filter((one) => !literal(one)),
      literals: keys.filter(literal),
      expose
    }
  })
}

/**
 * A key that begins with `~` is the key itself. No property is named so, and no value of a
 * property is taken for a key so, which keeps a literal's stream out of reach of whoever writes
 * the values.
 */
export function literal(key: string): boolean {
  return key.startsWith('~')
}
