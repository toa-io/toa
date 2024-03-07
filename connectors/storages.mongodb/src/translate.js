'use strict'

const parse = { ...require('./translate/criteria'), ...require('./translate/options') }

/**
 * @param {toa.core.storages.Query} query
 * @returns {{criteria: Object, options: Object}}
 */
const translate = (query) => {
  const result = {
    criteria: query?.criteria === undefined ? {} : parse.criteria(query.criteria),
    options: query?.options === undefined ? {} : parse.options(query.options)
  }

  if (query?.id !== undefined) {
    result.criteria._id = query.id
  }

  if (query?.version !== undefined) {
    result.criteria._version = query.version
  }

  result.criteria._deleted = null

  return result
}

exports.translate = translate
