'use strict'

const { addVariables } = require('./variables')

function compositions (compositions, variables) {
  for (const composition of compositions) {
    addVariables(composition, variables)
  }
}

exports.compositions = compositions
