'use strict'

const { hash } = require('@toa.io/generic')
const assert = require('node:assert')

// these defaults are required before validation
const defaults = (manifest) => {
  if (manifest.name === undefined) manifest.name = protoName(manifest)
  if (manifest.bindings === undefined) manifest.bindings = ['@toa.io/bindings.amqp']
  if (manifest.bridge === undefined) manifest.bridge = '@toa.io/bridges.node'

  if ('entity' in manifest) {
    if (manifest.entity.storage === null)
      manifest.entity.storage = '@toa.io/storages.null'
  } else {
    if (manifest.prototype === undefined)
      manifest.prototype = null
  }

  if (manifest.prototype === undefined) manifest.prototype = '@toa.io/prototype'

  // TODO: bridge.version()

  if (manifest.version === undefined) {
    const bridge = require(manifest.bridge)

    if ('version' in bridge)
      manifest.version = bridge.version(manifest)
  }

  if (manifest.version === undefined)
    console.warn(`Component '${manifest.namespace ? manifest.namespace + '.' : ''}${manifest.name}' has no version`)
}

function protoName (manifest) {
  return 'proto' + hash(manifest.path)
}

exports.defaults = defaults
