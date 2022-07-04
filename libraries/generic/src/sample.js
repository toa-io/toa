'use strict'

/**
 * @template T
 * @param array {T[]}
 * @returns {T}
 */
const sample = (array) => array[Math.floor(Math.random() * array.length)]

exports.sample = sample
