'use strict'

const { resolve } = require('../../lookup')

function bridge (manifest) {
  manifest.bridge = resolve(manifest.bridge, manifest.path)
}

exports.bridge = bridge
