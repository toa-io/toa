'use strict'

const { readdir } = require('node:fs/promises')
const { join } = require('node:path')

const { filter } = require('@toa.io/generic')
const { is } = require('./is')

/**
 * @param {string} path
 * @return {Promise<string[]>}
 */
async function directories (path) {
  const entries = await readdir(path)
  const paths = entries.map((entry) => join(path, entry))

  return await filter(paths, (path) => is(path))
}

exports.directories = directories
