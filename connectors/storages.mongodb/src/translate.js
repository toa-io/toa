'use strict'

const parse = { ...require('./translate/criteria'), ...require('./translate/options') }

/**
 * @param {toa.core.storages.Query} query
 * @returns {{criteria: Object, options: Object}}
 */
const translate = (query) => {
  const result = { criteria: {}, options: {} }

  if (query.criteria !== undefined) result.criteria = parse.criteria(query.criteria)
  if (query.options !== undefined) result.options = parse.options(query.options)
  if (query.id !== undefined) result.criteria._id = query.id
  if (query.version !== undefined) result.criteria._version = query.version

  return result
}

exports.translate = translate
