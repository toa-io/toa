'use strict'

const { join } = require('node:path')
const { createHash } = require('node:crypto')
const fs = require('node:fs/promises')

async function version (manifest) {
  manifest.version ??= await hash(manifest.path)
}

/**
 * Identifies a build of a component: it becomes the tag of its image, so it must be the
 * same for the same sources and different for different ones — on any machine.
 *
 * What the image excludes cannot change it: `node_modules` is in the `.dockerignore` the
 * build writes (see `operations/src/deployment/images/image.js`), so hashing it would only
 * retag an identical image after a local install.
 */
async function hash (path) {
  const files = (await list(path)).sort()
  const digests = await Promise.all(files.map((file) => digest(join(path, file))))
  const total = createHash('sha256')

  // the path is part of it: moving a file changes the build even if no content did
  for (let i = 0; i < files.length; i++)
    total.update(files[i]).update(digests[i])

  return total.digest('hex').slice(0, 8)
}

/**
 * @param {string} root
 * @param {string} [path] relative
 * @param {string[]} [acc]
 * @returns {Promise<string[]>} paths relative to `root`
 */
async function list (root, path = '', acc = []) {
  const entries = await fs.readdir(join(root, path), { withFileTypes: true })

  for (const entry of entries) {
    if (EXCLUDED.has(entry.name))
      continue

    const relative = path === '' ? entry.name : `${path}/${entry.name}`

    if (entry.isDirectory())
      await list(root, relative, acc)
    else if (entry.isFile())
      acc.push(relative)
  }

  return acc
}

async function digest (path) {
  return createHash('sha256').update(await fs.readFile(path)).digest()
}

const EXCLUDED = new Set(['node_modules', '.git'])

exports.version = version
