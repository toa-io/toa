'use strict'

async function meter (input, context) {
  return context.atom.meter(input.keys, input.deltas)
}

exports.computation = meter
