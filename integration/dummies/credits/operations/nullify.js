'use strict'

async function nullify (_, entity) {
  const balance = entity.balance

  entity.balance = 0

  return { output: balance }
}

exports.transition = nullify
