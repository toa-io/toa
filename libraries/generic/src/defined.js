'use strict'

/** @type {toa.generic.Defined} */
const defined = (object) => {
  for (const [key, value] of Object.entries(object)) {
    if (value === undefined) delete object[key]
  }

  return object
}

exports.defined = defined
