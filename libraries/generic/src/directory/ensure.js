'use strict'

const { resolve } = require('node:path')
const fs = require('node:fs/promises')

/**
 * Ensures empty target directory exists
 * @param path {string}
 * @returns {Promise<string>}
 */
const ensure = async (path) => {
  path = resolve(path)

  await fs.mkdir(path, { recursive: true })

  const entries = await fs.readdir(path)

  if (entries.length > 0) throw new Error('Target directory must be empty')

  return path
}

exports.ensure = ensure
