'use strict'

const { addVariables } = require('./variables')
const { addMounts } = require('./mounts')

function compositions (compositions, dependency) {
  for (const composition of compositions) {
    addVariables(composition, dependency.variables)
    addMounts(composition, dependency.mounts)
  }
}

exports.compositions = compositions
