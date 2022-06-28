'use strict'

const { dirname, join } = require('node:path')
const { empty, merge } = require('@toa.io/libraries/generic')

/**
 * Resolves package reference to absolute path
 *
 * @param {string} reference
 * @param {string} base
 * @param {string} [indicator]
 * @returns {string}
 */
const resolve = (reference, base, indicator = 'package.json') => {
  if (reference in SHORTCUTS) return SHORTCUTS[reference]
  if (KNOWN.includes(reference)) return reference

  const paths = base ? [base] : undefined

  return dirname(require.resolve(join(reference, indicator), { paths }))
}

/**
 * Finds object keys with known shortcuts, resolves and groups them to a given group key if provided
 *
 * @param {Object} object
 * @param {string} [group]
 */
const recognize = (object, group) => {
  if (object === undefined) return

  const target = group === undefined ? object : {}

  for (const [alias, name] of Object.entries(SHORTCUTS)) {
    const value = object[alias]

    if (value === undefined) continue

    delete object[alias]

    target[name] = value
  }

  if (group !== undefined && !empty(target)) object[group] = merge(object[group], target)
}

const SHORTCUTS = {
  http: '@toa.io/bindings.http',
  amqp: '@toa.io/bindings.amqp',
  node: '@toa.io/bridges.node',
  mongodb: '@toa.io/storages.mongodb',
  exposition: '@toa.io/extensions.exposition',
  origins: '@toa.io/extensions.origins',
  configuration: '@toa.io/extensions.configuration'
}

const KNOWN = Object.values(SHORTCUTS)

KNOWN.push('@toa.io/storages.null')

exports.recognize = recognize
exports.resolve = resolve
