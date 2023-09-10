'use strict'

async function computation (input) {
  return process.env[input]
}

exports.computation = computation
