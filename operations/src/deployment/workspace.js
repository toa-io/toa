'use strict'

const { mkdir, mkdtemp, readdir } = require('node:fs/promises')
const { join, resolve } = require('node:path')
const { tmpdir } = require('node:os')

/**
 * @param {string} type
 * @param {string} [path]
 * @return {Promise<string>}
 */
async function create (type, path) {
  if (path === undefined) return await mkdtemp(join(tmpdir(), 'toa-' + type))

  path = resolve(path)

  await mkdir(path, { recursive: true })

  const entries = await readdir(path)

  if (entries.length > 0) throw new Error('Target directory must be empty')

  return path
}

exports.create = create
