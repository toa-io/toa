'use strict'

async function transition ({ input }, object) {
  Object.assign(object, input)
}

module.exports = transition
