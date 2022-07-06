'use strict'

const { resolve } = require('../../shortcuts')

function bridge (manifest) {
  manifest.bridge = resolve(manifest.bridge)
}

exports.bridge = bridge
