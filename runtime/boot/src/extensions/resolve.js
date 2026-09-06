import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { find } from '@toa.io/generic'
import * as boot from '../../src/index.js'

import { instances } from './instances.js'

// what `find` returns is a package directory, and a module is loaded by file
const require = createRequire(import.meta.url)

// an extension is loaded once, and what is remembered while it loads is the
// promise, so two components cannot each make a factory
const loading = {}

/**
 * Loads an extension and remembers its factory.
 *
 * @param {string} reference
 * @param {string} base
 * @returns {Promise<import('@toa.io/core/types').extensions.Factory>}
 */
export const resolve = async (reference, base = process.cwd()) => {
  const path = find(reference, base)

  loading[path] ??= create(path)
  instances[path] = await loading[path]

  return instances[path]
}

/**
 * The factory of an extension already loaded. Everything that decorates what a
 * component is made of runs after its extensions are loaded, and stays
 * synchronous.
 *
 * @param {string} reference
 * @param {string} base
 * @returns {import('@toa.io/core/types').extensions.Factory}
 */
export const instance = (reference, base = process.cwd()) => {
  const factory = instances[find(reference, base)]

  if (factory === undefined) throw new Error(`Extension '${reference}' is not loaded`)

  return factory
}

const create = async (path) => {
  const { Factory } = await import(pathToFileURL(require.resolve(path)).href)

  return new Factory(boot.host())
}
