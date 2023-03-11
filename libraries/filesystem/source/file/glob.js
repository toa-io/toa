'use strict'

const find = require('fast-glob')

/**
 * @param {string} pattern
 * @returns {Promise<string[]>}
 */
const glob = async (pattern) => find(pattern, OPTIONS)

/**
 * @param {string} pattern
 * @returns {string[]}
 */
const sync = (pattern) => find.sync(pattern, OPTIONS)

const OPTIONS = { onlyFiles: true, absolute: true }

exports.glob = glob
exports.glob.sync = sync
