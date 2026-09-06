import * as _criteria from './translate/criteria.js'
import * as _options from './translate/options.js'

const parse = { ..._criteria, ..._options }

/**
 * @param {import('@toa.io/core/types').storages.Query} query
 * @param {string[]} [dates] properties held as BSON dates, so a criterion against one is one too
 * @returns {{criteria: Object, options: Object}}
 */
export const translate = (query, dates) => {
  const result = {
    criteria: query?.criteria === undefined ? {} : parse.criteria(query.criteria, dates),
    options: query?.options === undefined ? {} : parse.options(query.options),
    sample: query?.options?.sample
  }

  if (query?.id !== undefined) result.criteria._id = query.id

  if (query?.ids !== undefined) result.criteria._id = { $in: query.ids }

  if (query?.version !== undefined) result.criteria.VERSION = query.version

  if (query?.search !== undefined) result.criteria.$text = { $search: query.search }

  return result
}
