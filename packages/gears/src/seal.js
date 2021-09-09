'use strict'

const seal = (object) => {
  if (object === null) return

  const type = typeof object

  if (type !== 'object' && type !== 'function') return

  Object.seal(object)
  Object.getOwnPropertyNames(object).forEach(key => seal(object[key]))

  return object
}

exports.seal = seal
