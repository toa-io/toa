'use strict'

/**
 * @param {toa.samples.features.Context} context
 * @returns {toa.samples.suite.Operations}
 */
const operations = (context) => {
  const id = normalize(context.component)

  return {
    [id]: {
      [context.operation.endpoint]: context.operation.samples
    }
  }
}

/**
 * @param {string} id
 * @return {string}
 */
function normalize (id) {
  const parts = id.split('.').length

  if (parts === 1) return 'default.' + id
  else return id
}

exports.operations = operations
