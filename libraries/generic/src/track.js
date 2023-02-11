'use strict'

const { randomBytes } = require('node:crypto')

/** @type {toa.generic.track} */
const track = (context, method = undefined) => {
  if (method === undefined) return promises(context)

  context[KEY] ??= {}

  const tracking = context[KEY]

  return async function (...args) {
    const promise = method.apply(this, args)
    const id = randomBytes(8)

    tracking[id] = promise

    const result = await promise

    delete tracking[id]

    return result
  }
}

/**
 * @param {object} context
 * @returns {Promise<void> | undefined}
 */
const promises = (context) => {
  if (context[KEY] === undefined) return

  const promises = Object.values(context[KEY])

  return Promise.all(promises)
}

const KEY = Symbol('context tracking key')

exports.track = track
