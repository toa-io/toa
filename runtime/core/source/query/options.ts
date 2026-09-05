import { QuerySyntaxException } from '../exceptions.js'
import type { Options } from '../types/storages.js'
import type { Properties } from './criteria.js'

export function options (given: Record<string, any>, properties: Properties): Options {
  if (given.sort !== undefined) given.sort = sort(given.sort, properties)

  if (given.projection !== undefined) projection(given.projection, properties)

  return given as Options
}

function sort (sort: string[], properties: Properties): Array<[string, string]> {
  const result: Array<[string, string]> = []

  for (const sorting of sort) {
    const [property, direction] = sorting.split(':')

    if (properties[property] === undefined) {
      throw new QuerySyntaxException(`Sort property '${property}' is not defined`)
    }

    result.push([property, direction ?? 'asc'])
  }

  return result
}

function projection (projection: string[], properties: Properties): void {
  for (const property of projection) {
    if (properties[property] === undefined) {
      throw new QuerySyntaxException(`Projection property '${property}' is not defined`)
    }
  }

  for (const property of ['VERSION', 'CREATED', 'UPDATED', 'DELETED'])
    if (!projection.includes(property))
      projection.push(property)
}
