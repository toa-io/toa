'use strict'

const options = (options, properties) => {
  if (options.sort) { options.sort = sort(options.sort, properties) }
  if (options.projection) { options.projection = projection(options.projection, properties) }

  return options
}

const sort = (sort, properties) => {
  if (!sort.match(SORT_RX)) { throw new Error('sort parse error') }

  const result = []

  for (const sorting of sort.split(',')) {
    const [property, direction] = sorting.split(':')

    if (properties[property] === undefined) { throw new Error(`sort property ${property} is not allowed`) }

    result.push([property, direction || 'asc'])
  }

  return result
}

const projection = (projection, properties) => {
  if (!projection.match(PROJECTION_RX)) { throw new Error('projection parse error') }

  const result = projection.split(',')

  for (const property of result) {
    if (!properties[property]) { throw new Error(`projection property ${property} is not allowed`) }
  }

  return result
}

const SORT_RX = /^([a-z]+([-a-z0-9]*[a-z0-9]+)?(:(asc|desc))?)(,([a-z]+([-a-z0-9]*[a-z0-9]+)?(:(asc|desc))?))*$/
const PROJECTION_RX = /^([a-z]+([-a-z0-9]*[a-z0-9]+)?)(,([a-z]+([-a-z0-9]*[a-z0-9]+)?))*$/

exports.options = options
