'use strict'

const options = (options) => {
  if (options.sort) { options.sort = sort(options.sort) }
  if (options.projection) { options.projection = projection(options.projection) }

  return options
}

const sort = (sort) => {
  // eslint-disable-next-line no-throw-literal
  if (!sort.match(SORT_RX)) { throw { code: 100, message: 'query.sort parse error' } }

  const result = []

  for (const sorting of sort.split(',')) {
    const [property, direction] = sorting.split(':')

    result.push([property, direction])
  }

  return result
}

const projection = (projection) => {
  // eslint-disable-next-line no-throw-literal
  if (!projection.match(PROJECTION_RX)) { throw { code: 100, message: 'query.projection parse error' } }

  return projection.split(',')
}

const SORT_RX = /^([a-z]+([-a-z0-9]*[a-z0-9]+)?:(asc|desc))(,([a-z]+([-a-z0-9]*[a-z0-9]+)?:(asc|desc)))*$/
const PROJECTION_RX = /^([a-z]+([-a-z0-9]*[a-z0-9]+)?)(,([a-z]+([-a-z0-9]*[a-z0-9]+)?))*$/

exports.options = options
