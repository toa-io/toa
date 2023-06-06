'use strict'

const { stat } = require('node:fs/promises')
const { statSync } = require('node:fs')

/**
 * @param {string} path
 * @return {Promise<boolean>}
 */
const is = async (path) => {
  try {
    return await isFile(path)
  } catch {
    return false
  }
}

is.sync = (path) => {
  try {
    return isFileSync(path)
  } catch {
    return false
  }
}

/**
 * @param {string} path
 * @return {Promise<boolean>}
 */
const isFile = async (path) => {
  const entry = await stat(path)

  return entry.isFile()
}

/**
 * @param {string} path
 * @return {boolean}
 */
const isFileSync = (path) => {
  const entry = statSync(path)

  return entry.isFile()
}

exports.is = is
