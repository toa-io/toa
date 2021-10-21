'use strict'

async function transition (input, entry) {
  if (input.messages) entry.messages += 1
  if (input.bankrupt) entry.bankrupt = true
}

exports.transition = transition
