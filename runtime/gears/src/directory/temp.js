'use strict'

const { mkdtemp } = require('node:fs/promises')
const { join } = require('node:path')
const { tmpdir } = require('node:os')

/**
 * Creates temporary directory
 *
 * @param [prefix] {string}
 * @return {Promise<string>}
 */
const temp = async (prefix = '') => mkdtemp(join(tmpdir(), prefix))

exports.temp = temp
