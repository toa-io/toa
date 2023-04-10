'use strict'

/**
 * @param {boolean} on
 */
const dev = (on) => {
  if (on) process.env.TOA_ENV = '1'
  else delete process.env.TOA_DEV
}

exports.dev = dev
