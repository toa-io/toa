'use strict'

const { join, dirname } = require('node:path')

/**
 * Returns package path
 *
 * @param {string} id
 * @param {string} [rel]
 * @return {string}
 */
function pkg (id, rel = '.') {
  const packageRef = join(id, 'package.json')
  const packagePath = require.resolve(packageRef)
  const dir = dirname(packagePath)

  return join(dir, rel)
}

exports.pkg = pkg
