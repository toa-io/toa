import assert from 'node:assert'
import { segment } from '../../RTD/segment.js'
import { described, type Described } from './described.js'

/**
 * What the parameters of a method are, by name: a route variable, or one of the
 * querystring. Written where the method is, because what a variable means is what the
 * route it is in makes of it.
 *
 * A name is not checked against the template, because the template is not what says them
 * all: `map:segments` answers a variable under the property it fills instead, and that
 * name is nowhere here. What matches nothing is not answered.
 */
export class Parameters {
  public readonly subject: Subject
  public readonly parameters: Record<string, Described>

  /** What the route template names, which is a parameter whether an operation takes it or not. */
  public readonly variables: string[]

  public constructor(subject: Subject, value: unknown, route: string) {
    assert.ok(
      typeof value === 'object' && value !== null && !Array.isArray(value),
      `Directive help:${subject}: the value names each parameter it describes`
    )

    const parameters: Record<string, Described> = {}

    for (const [name, stated] of Object.entries(value))
      parameters[name] = described(`help:${subject}.${name}`, stated)

    this.subject = subject
    this.parameters = parameters
    this.variables = subject === 'route' ? names(route) : []
  }
}

/** The variables the template names, which are what a route parameter may be called. */
function names(route: string): string[] {
  return segment(route)
    .map((part) =>
      part.fragment !== null ? null : part.wildcard === true ? '**' : part.placeholder
    )
    .filter((name): name is string => name !== null)
}

export type Subject = 'route' | 'query'
