'use strict'

// these defaults are required before validation
const defaults = (manifest) => {
  if (manifest.prototype === undefined) manifest.prototype = '@kookaburra/prototype'
  if (manifest.bindings === undefined) manifest.bindings = ['@kookaburra/bindings.http', '@kookaburra/bindings.amqp']

  if (manifest.bridge === undefined && manifest.forward === undefined) {
    manifest.bridge = '@kookaburra/bridges.javascript.native'
  }
}

exports.defaults = defaults
