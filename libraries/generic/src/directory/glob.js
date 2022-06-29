'use strict'

const find = require('fast-glob')

/**
 * @param {string} pattern
 * @returns {Promise<string[]>}
 */
const glob = async (pattern) => {
  return find(pattern, { onlyDirectories: true, absolute: true })
}

exports.glob = glob
