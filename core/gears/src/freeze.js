'use strict'

const freeze = (value) => {
  if (value === null) { return }

  const type = typeof value

  if (type !== 'object' && type !== 'function') return value

  Object.freeze(value)
  Object.getOwnPropertyNames(value).forEach(key => freeze(value[key]))

  return value
}

exports.freeze = freeze
