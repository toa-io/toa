'use strict'

const { join } = require('node:path')

const { readFile, writeFile } = require('node:fs/promises')
const { readFileSync } = require('node:fs')
const { load: parse, dump } = require('js-yaml')

/**
 * @param {string} directory
 * @param {string} [additions]
 */
const template = async (directory, additions) => {
  const path = join(directory, FILENAME)
  const template = structuredClone(TEMPLATE)

  if (additions !== undefined) {
    const add = parse(additions)

    Object.assign(template, add)
  }

  await save(template, path)
}

/**
 * Drops a top-level annotation from an already written context.
 *
 * @param {string} directory
 * @param {string} key
 */
const remove = async (directory, key) => {
  const path = join(directory, FILENAME)
  const context = parse(await readFile(path, 'utf8'))

  delete context[key]

  await save(context, path)
}

const FILENAME = 'context.toa.yaml'
const TEMPLATE = parse(readFileSync(join(__dirname, FILENAME), 'utf8'))

exports.template = template
exports.remove = remove

/**
 * @param {object} object
 * @param {string} path
 * @return {Promise<void>}
 */
async function save (object, path) {
  await writeFile(path, dump(object, { noRefs: true, lineWidth: -1 }), 'utf8')
}
