'use strict'

const { empty, merge } = require('@toa.io/generic')

/**
 * Resolves shortcuts
 *
 * @param {string} token
 * @returns {string}
 */
const resolve = (token) => {
  if (token in SHORTCUTS) return SHORTCUTS[token]
  else return token
}

/**
 * Finds object keys with known shortcuts, resolves and groups them to a given group key if provided
 *
 * @param {Object} shortcuts
 * @param {Object} object
 * @param {string} [group]
 */
const recognize = (shortcuts, object, group) => {
  if (object === undefined) return

  const target = group === undefined ? object : {}

  for (const [alias, name] of Object.entries(shortcuts)) {
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
  sql: '@toa.io/storages.sql',
  queues: '@toa.io/storages.queues',
  exposition: '@toa.io/extensions.exposition',
  configuration: '@toa.io/extensions.configuration'
}

exports.recognize = recognize
exports.resolve = resolve
exports.SHORTCUTS = SHORTCUTS
