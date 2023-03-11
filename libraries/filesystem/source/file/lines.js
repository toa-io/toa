'use strict'

const { read } = require('./read')

/**
 * @param {string} file
 * @returns {Promise<string[]>}
 */
const lines = async (file) => {
  const content = await read(file)

  return content.split(N)
}

const N = '\n'

exports.lines = lines
