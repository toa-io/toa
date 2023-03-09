'use strict'

const { letters: { up } } = require('@toa.io/generic')

/** @type {toa.pointer.Variable} */
const variable = (scope, locator, label, value) => {
  const name = `TOA_${up(scope)}_${locator.uppercase}_${up(label)}`

  return { name, value }
}

exports.variable = variable
