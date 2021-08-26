'use strict'

const freeze = (object) => {
  if (object === null) { return }

  const type = typeof object

  if (type !== 'object' && type !== 'function') { return }

  Object.freeze(object)
  Object.getOwnPropertyNames(object).forEach(key => freeze(object[key]))

  return object
}

exports.freeze = freeze
