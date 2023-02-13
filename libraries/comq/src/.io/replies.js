'use strict'

const { randomBytes } = require('node:crypto')
const { EventEmitter } = require('node:events')

const { concat } = require('./concat')

/**
 * @param {string} label
 * @returns {comq.ReplyEmitter}
 */
const createReplyEmitter = (label) => {
  const id = randomBytes(8).toString('hex')
  const queue = concat(label, id)
  const events = new EventEmitter()
  const once = (name, callback) => events.once(name, callback)
  const emit = (name, value) => events.emit(name, value)

  events.setMaxListeners(0)

  return { queue, once, emit }
}

exports.createReplyEmitter = createReplyEmitter
