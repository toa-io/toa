'use strict'

const seal = (value) => {
  if ((typeof value === 'object' && value !== null) || typeof value === 'function') {
    Object.seal(value)
    Object.getOwnPropertyNames(value).forEach(key => seal(value[key]))
  }

  return value
}

exports.seal = seal
