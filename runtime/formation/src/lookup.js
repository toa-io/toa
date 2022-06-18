'use strict'

const { dirname } = require('node:path')
const { empty, merge } = require('@toa.io/gears')

/**
 * Resolves package reference to absolute path
 *
 * @param {string} reference
 * @param {string} [base]
 * @param {string} [indicator]
 * @returns {string}
 */
const resolve = (reference, base, indicator = 'package.json') => {
  const paths = [RUNTIME]

  if (base !== undefined) paths.push(base)

  return dirname(require.resolve(reference + '/' + indicator, { paths }))
}

/**
 * Finds object keys with known names, resolves and groups them to a given group key
 *
 * @param {Object} object
 * @param {string} [group]
 */
const recognize = (object, group) => {
  if (object === undefined) return

  const target = group === undefined ? object : {}

  for (const [alias, name] of Object.entries(KNOWN)) {
    const value = object[alias]

    if (value === undefined) continue

    delete object[alias]

    target[name] = value
  }

  if (group !== undefined && !empty(target)) object[group] = merge(object[group], target)
}

const KNOWN = {
  http: '@toa.io/bindings.http',
  amqp: '@toa.io/bindings.amqp',
  mongodb: '@toa.io/storages.mongodb',
  resources: '@toa.io/extensions.resources',
  origins: '@toa.io/extensions.origins'
}

const RUNTIME = dirname(require.resolve('@toa.io/runtime/package.json'))

exports.recognize = recognize
exports.resolve = resolve
