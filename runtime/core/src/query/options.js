'use strict'

const options = (options, properties, system) => {
  if (options.sort !== undefined) options.sort = sort(options.sort, properties)
  if (options.projection !== undefined) options.projection = projection(options.projection, properties, system)

  return options
}

const sort = (sort, properties) => {
  const result = []

  for (const sorting of sort.split(',')) {
    const [property, direction] = sorting.split(':')

    if (properties[property] === undefined) { throw new Error(`Sort property '${property}' is not allowed`) }

    result.push([property, direction || 'asc'])
  }

  return result
}

const projection = (projection, properties, system) => {
  const result = [...new Set(system.concat(projection.split(',')))]

  for (const property of result) {
    if (!properties[property]) { throw new Error(`Projection property '${property}' is not allowed`) }
  }

  return result
}

exports.options = options
