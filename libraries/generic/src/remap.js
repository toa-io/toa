'use strict'

/** @type {toa.generic.Remap} */
const remap = (object, callback) =>
  Object.fromEntries(Object.entries(object).map(([key, value]) => [key, callback(value, key)]))

exports.remap = remap
