'use strict'

/** @type {toa.generic.Timeout} */
const timeout = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

exports.timeout = timeout
