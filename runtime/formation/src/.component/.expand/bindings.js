'use strict'

const { resolve } = require('../../lookup')

function bindings (manifest) {
  if (manifest.bindings === undefined) return

  manifest.bindings = manifest.bindings.map((binding) => resolve(binding, manifest.path))
}

exports.bindings = bindings
