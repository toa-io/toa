'use strict'

const { stat } = require('node:fs/promises')

const exists = async (file) => {
  try {
    await stat(file)
    return true
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false
    }
    throw err
  }
}

exports.exists = exists
