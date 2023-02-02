'use strict'

/**
 * @param {toa.samples.features.Context} context
 * @returns {toa.samples.suite.Operations}
 */
const operations = (context) => {
  return {
    [context.component]: {
      [context.operation.endpoint]: context.operation.samples
    }
  }
}

exports.operations = operations
