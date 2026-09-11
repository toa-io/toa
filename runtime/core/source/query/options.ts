import { QuerySyntaxException } from '../exceptions.ts'
import type { Options } from '../types/storages.ts'
import type { Properties } from './criteria.ts'

export function options(given: Record<string, any>, properties: Properties): Options {
  if (given.sort !== undefined) given.sort = sort(given.sort, properties)

  if (given.projection !== undefined)
    given.projection = projection(given.projection, properties)

  return given as Options
}

function sort(sort: string[], properties: Properties): Array<[string, string]> {
  const result: Array<[string, string]> = []

  for (const sorting of sort) {
    const [property, direction] = sorting.split(':')

    if (properties[property] === undefined)
      throw new QuerySyntaxException(`Sort property '${property}' is not defined`)

    result.push([property, direction ?? 'asc'])
  }

  return result
}

/**
 * A copy, because a route declares one projection and sends it with every request it serves,
 * and the system properties are what every read answers besides.
 */
function projection(declared: string[], properties: Properties): string[] {
  for (const property of declared)
    if (properties[property] === undefined)
      throw new QuerySyntaxException(`Projection property '${property}' is not defined`)

  const projection = declared.slice()

  for (const property of SYSTEM)
    if (!projection.includes(property)) projection.push(property)

  return projection
}

const SYSTEM = ['VERSION', 'CREATED', 'UPDATED', 'DELETED', 'REGION']
