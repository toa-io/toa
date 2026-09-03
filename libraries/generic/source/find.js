import { createRequire } from 'node:module'
import { dirname, join, basename } from 'node:path'

// import.meta.resolve takes no paths, and every reference here is resolved
// against a base that is not this module
const require = createRequire(import.meta.url)

/**
 * Returns the directory of the package referenced by `reference`,
 * resolved against `base` and the runtime.
 *
 * @param {string} reference
 * @param {string} base
 * @param {string} [indicator]
 * @return {string}
 */
export const find = (reference, base, indicator = 'package.json') => {
  const runtime = dirname(require.resolve('@toa.io/runtime'))
  const paths = [base, runtime]
  const filename = basename(reference)

  let request = filename === indicator ? reference : join(reference, indicator)

  try {
    return dirname(require.resolve(request, { paths }))
  } catch {
    /*
    I've failed to reproduce the problem with unit tests. I think jest might break the default behaviour
    of the require.resolve. It is reproduced with `features/cli/serve.debug.feature`.
    */

    // try as relative reference
    request = './' + request

    return dirname(require.resolve(request, { paths }))
  }
}
