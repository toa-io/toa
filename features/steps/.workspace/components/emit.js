'use strict'

const stage = require('@toa.io/userland/stage')

const binding = stage.binding.binding

/**
 * @param {string} label
 * @param {any} payload
 */
async function emit (label, payload) {
  const message = { payload }

  await binding.emit(label, message)
}

exports.emit = emit
