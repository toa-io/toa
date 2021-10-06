'use strict'

async function transition (input, entry) {
  if (input.messages) entry.messages += 1
}

module.exports = transition
