'use strict'

const parse = { ...require('./translate/criteria'), ...require('./translate/options') }

const translate = (query) => {
  const result = {}

  if (query.criteria) { result.criteria = parse.criteria(query.criteria) }
  if (query.options) { result.options = parse.options(query.options) }

  return result
}

exports.translate = translate
