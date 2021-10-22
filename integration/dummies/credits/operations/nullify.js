'use strict'

async function nullify (_, entry) {
  const balance = entry.balance

  entry.balance = 0

  return { output: balance }
}

exports.transition = nullify
