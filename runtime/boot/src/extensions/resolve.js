import { pathToFileURL } from 'node:url'
import { find } from '@toa.io/generic'
import * as boot from '../../src/index.js'

import { instances } from './instances.js'

/**
 * @param {string} reference
 * @param {string} base
 * @returns {Promise<toa.core.extensions.Factory>}
 */
const resolve = async (reference, base = process.cwd()) => {
  const path = find(reference, base)

  // the promise is what is remembered, so two components cannot each make a factory
  instances[path] ??= create(path)

  return await instances[path]
}

const create = async (path) => {
  const { Factory } = await import(pathToFileURL(path).href)

  return new Factory(boot)
}

export { resolve }
