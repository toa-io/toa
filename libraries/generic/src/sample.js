'use strict'

/**
 * @template T
 * @param array {Array<T>}
 * @returns {T}
 */
const sample = (array) => array[Math.floor(Math.random() * array.length)]

exports.sample = sample
