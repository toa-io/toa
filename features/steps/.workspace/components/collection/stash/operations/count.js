'use strict'

const INTERVAL = 1000

async function count (input, context) {
  let count = 0

  // synchronous by contract, so a burst within one turn cannot be flushed midway
  for (let i = 0; i < input.times; i++)
    count = context.stash.count(input.name, INTERVAL)

  return count
}

exports.computation = count
