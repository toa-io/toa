'use strict'

const { dirname, resolve } = require('node:path')
const findUp = require('find-up')

/**
 * @param {string | string[]} from
 * @param {string} filename
 * @param {boolean} test
 * @return {string | string[] | null}
 */
const find = (from, filename, test) => {
  if (from instanceof Array) {
    const found = new Set(from.map((path) => find(path, filename, true)))

    found.delete(null)

    if (found.size === 0) {
      if (test === true) return null
      else throw new Error(`File '${filename}' is not found in ${from.join(', ')}`)
    }

    return [...found]
  }

  const cwd = resolve(process.cwd(), from)
  const path = findUp.sync(filename, { cwd })

  if (path === undefined) {
    if (test === true) return null
    else throw new Error(`Cannot find '${filename}' from '${from}'`)
  }

  return dirname(path)
}

/**
 * @param {string | string[]} from
 * @param {boolean} test
 * @return {string | string[] | null}
 */
const components = (from, test = false) => find(from, MANIFEST, test)

/**
 * @param {string | string[]} from
 * @param {boolean} test
 * @return {string | string[] | null}
 */
const context = (from, test = false) => find(from, CONTEXT, test)

const MANIFEST = 'manifest.toa.yaml'
const CONTEXT = 'context.toa.yaml'

exports.components = components
exports.context = context
