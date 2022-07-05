'use strict'

const { dirname, join } = require('node:path')

const find = (reference, base, indicator = 'package.json') => {
  const paths = [RUNTIME, base]

  let request = join(reference, indicator)

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
