'use strict'

const fs = require('node:fs/promises')
const { join } = require('node:path')
const { tmpdir } = require('node:os')

const directory = async (path) => {
  if (path === undefined) {
    path = await fs.mkdtemp(join(tmpdir(), 'toa-deployment-'))
  } else {
    await fs.mkdir(path, { recursive: true })

    const entries = await fs.readdir(path)

    if (entries.length > 0) throw new Error('Target directory must be empty')
  }

  return path
}

exports.directory = directory
