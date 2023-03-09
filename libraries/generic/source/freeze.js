'use strict'

const freeze = (value) => {
  if ((typeof value === 'object' && value !== null) || typeof value === 'function') {
    Object.freeze(value)
    Object.getOwnPropertyNames(value).forEach(key => freeze(value[key]))
  }

  return value
}

exports.freeze = freeze
