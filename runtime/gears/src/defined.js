'use strict'

const defined = (object) => {
  for (const key of Object.getOwnPropertyNames(object)) {
    if (object[key] === undefined) delete object[key]
  }

  return object
}

exports.defined = defined
