'use strict'

const { lookup } = require('../../lookup')

function bindings (manifest) {
  if (manifest.bindings === undefined) return

  manifest.bindings = manifest.bindings.map((binding) => lookup(binding, manifest.path))
}

exports.bindings = bindings
