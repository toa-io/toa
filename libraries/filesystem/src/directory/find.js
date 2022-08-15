'use strict'

const { dirname, join, basename } = require('node:path')

const find = (reference, base, indicator = 'package.json') => {
  const paths = [base, RUNTIME]
  const filename = basename(reference)

  let request = filename === indicator ? reference : join(reference, indicator)

  try {
    return dirname(require.resolve(request, { paths }))
  } catch {
    /*
    I've failed to reproduce the problem with unit tests. I think jest might break the default behaviour
    of the require.resolve. It's been reproduced with `features/cli/serve.debug.feature`.
     */

    // try as relative reference
    request = './' + request

    return dirname(require.resolve(request, { paths }))
  }
}

const RUNTIME = dirname(require.resolve('@toa.io/runtime'))

exports.find = find
