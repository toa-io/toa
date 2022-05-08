'use strict'

/**
 * @template T
 * @param array {Array<T>}
 * @returns {T}
 */
exports.sample = (array) => array[Math.floor(Math.random() * array.length)]
