'use strict'

const { join } = require('node:path')

exports.version = function(manifest) {
  const pkgPath = join(manifest.path, 'package.json')

  try {
    const pkg = require(pkgPath)

    return pkg.version
  } catch {
    return undefined
  }
}
