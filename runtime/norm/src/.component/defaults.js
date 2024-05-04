'use strict'

const { hash } = require('@toa.io/generic')
const assert = require('node:assert')

// these defaults are required before validation
const defaults = (manifest, proto) => {
  if (manifest.name === undefined)
    if (proto) manifest.name = protoName(manifest)
    else nameAfterDir(manifest)

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
}

function protoName (manifest) {
  return 'proto' + hash(manifest.path)
}

function nameAfterDir (manifest) {
  const parts = manifest.path.split('/')
  const dirname = parts[parts.length - 1]
  const [name, namespace] = dirname.split('.').reverse()

  manifest.name = name
  manifest.namespace = namespace
}

exports.defaults = defaults
