'use strict'

const { dirname, join } = require('node:path')

/**
 * Finds directory with indicator file
 *
 * @param {string} reference
 * @param {string} base
 * @param {string} [indicator]
 */
const find = (reference, base, indicator = 'package.json') => {
  const paths = [base]

  let request = join(reference, indicator)

  try {
    return dirname(require.resolve(request, { paths }))
  } catch {
    /*
    I've failed to reproduce the problem with unit tests. I think jest might break the default behaviour
    of the require.resolve. It's been reproduced with `features/cli/serve.handler.feature`.
     */

    // try as relative reference
    request = './' + request

    return dirname(require.resolve(request, { paths }))
  }
}

exports.find = find
