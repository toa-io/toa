'use strict'

// these defaults are required before validation
const defaults = (manifest) => {
  if (manifest.prototype === undefined) manifest.prototype = '@toa.io/prototype'
  if (manifest.bindings === undefined) manifest.bindings = ['@toa.io/bindings.http', '@toa.io/bindings.amqp']

  if (manifest.bridge === undefined && manifest.forward === undefined) {
    manifest.bridge = '@toa.io/bridges.javascript.native'
  }
}

exports.defaults = defaults
