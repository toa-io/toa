'use strict'

const bridge = ({ manifest, ...rest }) => {
  const { Bridge } = require(manifest.bridge)
  const bridge = new Bridge(manifest)

  return { bridge, manifest, ...rest }
}

exports.bridge = bridge
