'use strict'

const { randomBytes } = require('node:crypto')
const { EventEmitter } = require('node:events')

/**
 * @param {string} label
 * @returns {toa.messenger.Replies}
 */
const replies = (label) => {
  const id = randomBytes(8).toString('hex')
  const queue = label + '..' + id
  const events = new EventEmitter()
  const once = (name, callback) => events.once(name, callback)
  const emit = (name, value) => events.emit(name, value)

  return { queue, once, emit }
}

exports.replies = replies
