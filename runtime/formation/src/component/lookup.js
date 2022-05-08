'use strict'

const { dirname, resolve, join } = require('node:path')

/**
 * Resolves referenced absolute path
 * @param {string} reference - Relative or absolute path or module name
 * @param {string} base - Base for absolute path and node modules resolution
 * @return {string} - Absolute path
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

const KNOWN = {
  http: '@toa.io/bindings.http',
  amqp: '@toa.io/bindings.amqp',
  resources: '@toa.io/extensions.resources'
}

exports.lookup = lookup
