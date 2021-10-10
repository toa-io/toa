'use strict'

async function transition (_, entry) {
  const balance = entry.balance

  entry.balance = 0

  return balance
}

exports.transition = transition
