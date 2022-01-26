'use strict'

const fs = require('node:fs/promises')
const { join } = require('node:path')
const { tmpdir } = require('node:os')

const directory = async (path) => {
  await fs.mkdir(path, { recursive: true })

  const entries = await fs.readdir(path)

  if (entries.length > 0) throw new Error('Target directory must be empty')

  return path
}

directory.temp = async (type) => await fs.mkdtemp(join(tmpdir(), `toa-${type}-`))

exports.directory = directory
