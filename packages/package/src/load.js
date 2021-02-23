import path from 'path'
import glob from 'glob-promise'

import manifest from './manifest'
import operations from './operations'

/**
 * @param dir {string} Package dir
 * @param options {Object}
 */
export default async (dir, options) => {
  const opts = { ...DEFAULTS, ...options }

  const manifestPath = path.resolve(dir, opts.manifestFile)
  const operationsGlob = path.resolve(dir, opts.operationsPath, '*')

  const operationFiles = await glob(operationsGlob)

  return {
    manifest: await manifest(manifestPath),
    operations: operations(operationFiles)
  }
}

const DEFAULTS = {
  manifestFile: 'kookaburra.yaml',
  operationsPath: './operations'
}
