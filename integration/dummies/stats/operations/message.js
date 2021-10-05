'use strict'

async function transition (_, entry) {
  entry.messages += 1
}

module.exports = transition
