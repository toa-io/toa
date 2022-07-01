'use strict'

const { stat } = require('node:fs/promises')

const is = async (path) => {
  const entry = await stat(path)

  return entry.isDirectory()
}

exports.is = is
