'use strict'

/**
 * @template {{ title: string }} T
 * @param {T[]} samples
 * @param {string} expression
 * @returns {T}
 */
function filter (samples, expression) {
  const rx = new RegExp(expression)

  return samples.filter((sample) => rx.test(sample.title))
}

exports.filter = filter
