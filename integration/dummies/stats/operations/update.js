'use strict'

async function transition (input, object) {
  if (input.messages) object.messages += 1
  if (input.bankrupt) object.bankrupt = true
}

exports.transition = transition
