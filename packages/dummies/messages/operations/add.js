'use strict'

async function transition ({ input, output }, object) {
  console.log('transition called with', object)
}

module.exports = transition
