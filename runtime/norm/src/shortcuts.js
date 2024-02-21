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
  amqp: '@toa.io/bindings.amqp',
  node: '@toa.io/bridges.node',
  bash: '@toa.io/bridges.bash',
  mongodb: '@toa.io/storages.mongodb',
  sql: '@toa.io/storages.sql',
  queues: '@toa.io/storages.queues',
  exposition: '@toa.io/extensions.exposition',
  realtime: '@toa.io/extensions.realtime',
  configuration: '@toa.io/extensions.configuration',
  origins: '@toa.io/extensions.origins',
  stash: '@toa.io/extensions.stash',
  storages: '@toa.io/extensions.storages'
}

exports.recognize = recognize
exports.resolve = resolve
exports.SHORTCUTS = SHORTCUTS
