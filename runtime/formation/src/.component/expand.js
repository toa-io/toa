'use strict'

const { entity, bridge, bindings, operations, events, receivers, extensions } = require('./.expand')

const expand = (manifest) => {
  entity(manifest)
  bridge(manifest)
  bindings(manifest)
  operations(manifest)
  events(manifest)
  receivers(manifest)
  extensions(manifest)
}

exports.expand = expand
