import { join, relative } from 'node:path'
import glob from 'fast-glob'
import { readFileSync } from 'node:fs'
import * as jsyaml from 'js-yaml'

/**
 * @param {string} path
 * @returns {object[]}
 */
export const readDirectory = (path) => {
  const pattern = join(path, '**', '*' + EXTENSION)
  const files = glob.sync(pattern, GLOB)

  return files.map(load(path))
}

/**
 * @param {string} root
 * @returns {object}
 */
const load = (root) => (path) => {
  const schema = jsyaml.load(readFileSync(path, 'utf8'))
  const id = calculateID(root, path)

  return { id, schema }
}

/**
 * @param {string} root
 * @param {string} path
 * @returns {string}
 */
const calculateID = (root, path) => {
  const base = path.slice(0, -EXTENSION.length)

  return relative(root, base)
}

const EXTENSION = '.cos.yaml'

const GLOB = { onlyFiles: true, absolute: true }
