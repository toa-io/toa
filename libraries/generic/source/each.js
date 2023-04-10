'use strict'

/** @type {toa.generic.Each} */
const each = async (array, callback) => {
  let i = 0
  const promises = []

  for (const item of array) {
    const result = callback(item, i)

    if (result instanceof Promise) promises.push(setAsync(array, i, result))
    else set(array, i, result)

    i++
  }

  if (promises.length > 0) return Promise.all(promises)
}

/**
 * @param {any[]} array
 * @param {number} i
 * @param {any} value
 */
function set (array, i, value) {
  if (value !== undefined) array[i] = value
}

/**
 * @param {any[]} array
 * @param {number} i
 * @param {Promise<any>} promise
 * @returns {Promise<void>}
 */
async function setAsync (array, i, promise) {
  const value = await promise

  set(array, i, value)
}

exports.each = each
