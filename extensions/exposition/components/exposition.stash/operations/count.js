'use strict'

async function count (input, context) {
  return context.stash.count(input.name, input.interval, input.amount)
}

exports.computation = count
