'use strict'

const { stat } = require('node:fs/promises')

/**
 * @param {string} path
 * @return {Promise<boolean>}
 */
const is = async (path) => {
  try {
    return await file(path)
  } catch {
    return false
  }
}

/**
 * @param {string} path
 * @return {Promise<boolean>}
 */
const file = async (path) => {
  const entry = await stat(path)

  return entry.isFile()
}

exports.is = is
