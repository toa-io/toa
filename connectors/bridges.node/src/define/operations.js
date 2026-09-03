import * as load from '../load.js'
import * as algorithm from './.operations/index.js'

/** @type {toa.node.define.Algorithms} */
export const operations = async (root) => {
  const modules = await load.operations(root)

  /** @type {toa.node.define.algorithms.List} */
  const algorithms = {}

  for (const [name, module] of modules) {
    const definition = algorithm.define(module)

    if (definition !== null) algorithms[name] = definition
  }

  return algorithms
}

export const extract = (module) => algorithm.extract(module)
