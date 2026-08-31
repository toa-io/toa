'use strict'

async function meter (input, context) {
  return context.stash.meter(input.keys, input.deltas)
}

exports.computation = meter
