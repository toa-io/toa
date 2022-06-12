'use strict'

const { dirname, resolve, join } = require('node:path')

/**
 * @param {string} reference
 * @param {string} base
 * @return {string}
 */
const lookup = (reference, base) => {
  if (KNOWN[reference]) reference = KNOWN[reference]

  try {
    const paths = [__dirname] // this will find toa packages installed globally

    if (base !== undefined) paths.push(base)

    const root = join(reference, 'package.json')
    const path = require.resolve(root, base !== undefined ? { paths } : undefined)

    return dirname(path)
  } catch {
    return base === undefined ? reference : resolve(base, reference)
  }
}

/**
 * Finds object keys with known names, resolves and groups them to a given group key
 * @param {object} object
 * @param {string} [group]
 */
const recognize = (object, group) => {
  let target

  if (group === undefined) target = object
  else {
    if (object[group] === undefined) object[group] = {}

    target = object[group]
  }

  for (const [alias, name] of Object.entries(KNOWN)) {
    const value = object[alias]

    if (value === undefined) continue

    delete object[alias]
    target[name] = value
  }
}

const KNOWN = {
  http: '@toa.io/bindings.http',
  amqp: '@toa.io/bindings.amqp',
  resources: '@toa.io/extensions.resources',
  origins: '@toa.io/extensions.origins'
}

exports.lookup = lookup
exports.recognize = recognize
