'use strict'

const { readFile } = require('node:fs/promises')

/**
 * @param {string} file
 * @returns {Promise<string>}
 */
const read = (file) => readFile(file, OPTIONS)

const OPTIONS = { encoding: 'utf8' }

exports.read = read
