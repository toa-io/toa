'use strict'

const boot = require('./index')

async function rc (manifest, context) {
  return boot.bridge.rc(manifest.bridge, manifest.path, context)
}

exports.rc = rc
