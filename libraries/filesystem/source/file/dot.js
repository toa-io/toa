'use strict'

const find = require('find-up')

/**
 * @param {string} name
 * @returns {string | undefined}
 */
async function dot (name) {
  const filename = '.' + name

  return find(filename)
}

exports.dot = dot
