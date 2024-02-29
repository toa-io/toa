'use strict'

const {
  entity,
  bridge,
  operations,
  events,
  receivers,
  extensions,
  properties,
  version
} = require('./.expand')

async function expand (manifest) {
  entity(manifest)
  bridge(manifest)
  operations(manifest)
  events(manifest)
  receivers(manifest)
  properties(manifest)
  extensions(manifest)

  await version(manifest)
}

exports.expand = expand
