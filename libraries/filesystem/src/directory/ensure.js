'use strict'

const { resolve } = require('node:path')
const fs = require('node:fs/promises')

const ensure = async (path) => {
  path = resolve(path)

  await fs.mkdir(path, { recursive: true })

  const entries = await fs.readdir(path)

  if (entries.length > 0) throw new Error('Target directory must be empty')

  return path
}

exports.ensure = ensure
