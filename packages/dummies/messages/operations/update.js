'use strict'

async function transition (input, entry) {
  Object.assign(entry, input)
}

module.exports = transition
