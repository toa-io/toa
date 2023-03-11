'use strict'

const { stat } = require('node:fs/promises')

/**
 * @param {string} path
 * @returns {Promise<boolean>}
 */
const is = async (path) => {
  try {
    return await dir(path)
  } catch {
    return false
  }
}

const dir = async (path) => {
  const entry = await stat(path)

  return entry.isDirectory()
}

exports.is = is
