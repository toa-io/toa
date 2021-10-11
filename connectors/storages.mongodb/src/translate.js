'use strict'

const parse = { ...require('./translate/criteria'), ...require('./translate/options') }

const translate = (query) => {
  const result = { criteria: {} }

  if (query.criteria) result.criteria = parse.criteria(query.criteria)
  if (query.options) result.options = parse.options(query.options)
  if (query.id) result.criteria._id = query.id
  if (query.version) result.criteria._version = query.version

  return result
}

exports.translate = translate
