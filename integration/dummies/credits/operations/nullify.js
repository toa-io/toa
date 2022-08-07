'use strict'

async function nullify (_, object) {
  const balance = object.balance

  object.balance = 0

  return { output: balance }
}

exports.transition = nullify
