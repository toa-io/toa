'use strict'

const { join } = require('node:path')
const { createHash } = require('node:crypto')
const fs = require('node:fs/promises')
const { createReadStream } = require('node:fs')
const { once } = require('node:events')

async function version (manifest) {
  manifest.version ??= await hash(manifest.path)
}

async function hash (path) {
  const hash = await hashd(path)

  return hash.digest('hex').slice(0, 8)
}

/**
 * @param {string} path
 * @param {import('node:crypto').Hash} hash
 */
async function hashd (path, hash = createHash('sha256')) {
  const stat = await fs.stat(path)

  if (stat.isFile()) {
    const stream = createReadStream(path)

    stream.pipe(hash, { end: false })

    return await once(stream, 'end')
  }

  if (stat.isDirectory()) {
    const entries = await fs.opendir(path)

    for await (const entry of entries) {
      await hashd(join(path, entry.name), hash)
    }

    return hash
  }
}

exports.version = version
