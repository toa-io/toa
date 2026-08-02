'use strict'

const { addVariables } = require('./variables')
const { addMounts } = require('./mounts')

function compositions (compositions, dependency) {
  for (const composition of compositions) {
    addVariables(composition, dependency.variables)
    addMounts(composition, dependency.mounts)

    if (dependency.probe !== undefined && dependency.probe !== false)
      composition.probe ??= dependency.probe
  }
}

exports.compositions = compositions
