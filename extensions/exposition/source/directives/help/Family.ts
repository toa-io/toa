import { Help } from './Help.js'
import { Parameters } from './Parameters.js'
import type { Introspection, Schema } from '../../Introspection.js'
import type { Described } from './described.js'
import type { Context } from '../../HTTP/index.js'
import type { DirectiveFamily } from '../../RTD/index.js'

/** The name the family is declared under, and what a consumer of one asks a method for. */
export const FAMILY = 'help'

export type Directive = Help | Parameters

export class Family implements DirectiveFamily<Directive> {
  public readonly name = FAMILY
  public readonly mandatory = false

  /**
   * What a node says of itself is not said of what is under it: inherited, `help:node`
   * would describe every resource below as the one it was written for. The rest go with
   * it — a sentence about one method is not true of the next, and a route variable a
   * template does not have is not one at all.
   */
  public readonly inherited = false

  /** What the nearest declaration says of the method, or nothing where none does. */
  public static method(directives: Directive[] | undefined): Help | null {
    return stated(directives, 'method')
  }

  /** And the same of the resource the method is on. */
  public static node(directives: Directive[] | undefined): Help | null {
    return stated(directives, 'node')
  }

  // eslint-disable-next-line max-params
  public create(name: string, value: unknown, _: unknown, route: string): Directive {
    if (name === 'node' || name === 'method') return new Help(name, value)

    if (!(name === 'route' || name === 'query'))
      throw new Error(`Unknown directive: help:${name}`)

    return new Parameters(name, value, route)
  }

  /** What the route states this method and its parameters are. */
  public explain(
    directives: Directive[],
    _: Context,
    introspection: Introspection
  ): Introspection | null {
    const help = Family.method(directives)

    // what is hidden is hidden from every answer at once, this being the one place they
    // all read; the method itself is reached as it always was
    if (help?.hidden === true) return null

    const described: Introspection = {
      ...introspection,
      ...(help?.title === undefined ? {} : { title: help.title }),
      ...(help?.description === undefined ? {} : { description: help.description })
    }

    // a schema says `title` and `description` of what it describes, which is where these go
    for (const subject of PARAMETERS) {
      const declaration = declared(directives, subject)

      if (declaration === null) continue

      const parameters = declaration.parameters

      for (const [name, stated] of Object.entries(parameters)) {
        const schema = described[subject]?.[name]

        /*
         * A route variable is one because the template names it, whether or not the
         * operation declares it as input — and only then is it answered. `:id` on an
         * observation is the ordinary case: it is taken by the query, so nothing describes
         * it and the caller is not told it is a path parameter at all.
         *
         * Anything else is described only where it is already answered: a querystring
         * parameter is one only where the mapping takes it, and a segment `map:segments`
         * renames is answered under the property it fills.
         */
        if (schema === undefined && !declaration.variables.includes(name)) continue

        // written where the shape states it, whatever the schema already said
        const merged = { ...schema } as Record<string, unknown>

        delete merged.title
        delete merged.description

        described[subject] ??= {}
        described[subject]![name] = Object.assign(merged, stated) as unknown as Schema
      }
    }

    return described
  }
}

const PARAMETERS = ['route', 'query'] as const

function stated(directives: Directive[] | undefined, subject: string): Help | null {
  const help = directives?.find(
    (directive) => directive instanceof Help && directive.subject === subject
  )

  return (help as Help | undefined) ?? null
}

function declared(
  directives: Directive[] | undefined,
  subject: string
): Parameters | null {
  const found = directives?.find(
    (directive) => directive instanceof Parameters && directive.subject === subject
  )

  return (found as Parameters | undefined) ?? null
}

export type { Described }
