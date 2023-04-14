'use strict'

const { readFile } = require('node:fs/promises')
const { readFileSync } = require('node:fs')

/**
 * @param {string} file
 * @return {Promise<string>}
 */
const read = async (file) => await readFile(file, OPTIONS)

/**
 * @param {string} file
 * @return {string}
 */
read.sync = (file) => readFileSync(file, OPTIONS)

const OPTIONS = { encoding: 'utf8' }

exports.read = read
