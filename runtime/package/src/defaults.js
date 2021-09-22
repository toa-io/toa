'use strict'

// these defaults are required before validation

const defaults = (manifest) => {
  if (manifest.prototype === undefined) manifest.prototype = '@kookaburra/prototype'
  if (!manifest.bridge) manifest.bridge = '@kookaburra/bridges.javascript.native'
}

exports.defaults = defaults
