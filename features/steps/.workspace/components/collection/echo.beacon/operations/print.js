'use strict'

async function computation (input) {
  return { output: process.env[input] }
}

exports.computation = computation
