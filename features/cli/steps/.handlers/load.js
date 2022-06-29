'use strict'

const { dirname, join } = require('node:path')

/**
 * @param {string} name
 */
const load = (name) => {
  const path = join(ROOT, name)
  const module = require(path)

  return module[name]
}

const ROOT = join(dirname(require.resolve('@toa.io/cli')), 'handlers')

exports.load = load
