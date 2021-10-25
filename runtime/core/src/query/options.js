'use strict'

const { QuerySyntaxException } = require('../exceptions')

const options = (options, properties, system) => {
  if (options.sort !== undefined) options.sort = sort(options.sort, properties)
  if (options.projection !== undefined) options.projection = projection(options.projection, properties, system)

  return options
}

const sort = (sort, properties) => {
  const result = []

  for (const sorting of sort) {
    const [property, direction] = sorting.split(':')

    if (properties[property] === undefined) {
      throw new QuerySyntaxException(`Sort property '${property}' is not defined`)
    }

    result.push([property, direction || 'asc'])
  }

  return result
}

const projection = (projection, properties, system) => {
  const set = [...new Set(system.concat(projection))]

  for (const property of set) {
    if (properties[property] === undefined) {
      throw new QuerySyntaxException(`Projection property '${property}' is not defined`)
    }
  }

  return set
}

exports.options = options
