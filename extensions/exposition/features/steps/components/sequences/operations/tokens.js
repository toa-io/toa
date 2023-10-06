'use strict'

const { randomBytes } = require('node:crypto')

async function * computation () {
  while (true) {
    await timeout(Math.floor(Math.random() * 100) + 10)
    yield randomBytes(4).toString('hex')
  }
}

function timeout (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

exports.computation = computation
