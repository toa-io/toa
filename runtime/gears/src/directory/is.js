'use strict'

const { stat } = require('node:fs/promises')

/**
 * @param path {string}
 * @returns {boolean}
 */
const is = async (path) => {
  const entry = await stat(path)

  return entry.isDirectory()
}

exports.is = is
