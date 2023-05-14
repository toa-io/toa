'use strict'

/**
 * @template {object} T
 * @param {T} object
 * @param {(value: any, key?: string) => any} callback
 * @returns {T}
 */
const remap = (object, callback) =>
  Object.fromEntries(Object.entries(object).map(([key, value]) => [key, callback(value, key)]))

exports.remap = remap
