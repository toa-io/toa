'use strict'

const { lookup } = require('../../lookup')

function bridge (manifest) {
  manifest.bridge = lookup(manifest.bridge, manifest.path)
}

exports.bridge = bridge
