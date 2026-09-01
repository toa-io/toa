'use strict'

async function slots (input, context) {
  // an empty reply where nothing is owned, so that the contract is one array either way
  return context.atom.slots(input.total) ?? []
}

exports.computation = slots
