'use strict'

async function transition (input, entity) {
  if (input.messages) entity.messages += 1
  if (input.bankrupt) entity.bankrupt = true
}

exports.transition = transition
