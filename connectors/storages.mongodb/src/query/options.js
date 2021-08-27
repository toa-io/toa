'use strict'

const options = (options) => {
  const result = {}

  if (options.omit) { result.skip = options.omit }
  if (options.limit) { result.limit = options.limit }
  if (options.sort) { result.sort = sort(options.sort) }
  if (options.projection) { result.projection = projection(options.projection) }

  return result
}

const sort = (sort) => {
  return sort.map(([property, direction]) => [property, DIRECTIONS[direction]])
}

const projection = (projection) => {
  const result = {}

  for (const property of projection) { result[property] = 1 }

  return result
}

const DIRECTIONS = {
  asc: 1,
  desc: -1
}

exports.options = options
