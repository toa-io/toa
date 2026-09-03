import { extract } from './extract.js'
import * as syntaxes from './syntaxes/index.js'

/**
 * @param {Object} module
 * @returns {toa.node.define.operations.Definition}
 */
export const define = (module) => {
  const descriptor = extract(module)

  if (descriptor === null)
    return null

  return syntaxes[descriptor.syntax].define(descriptor)
}
