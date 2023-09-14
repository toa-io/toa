'use strict'

/**
 * @param {any[]} array
 * @param {(any) => Promise<boolean>} test
 */
async function filter (array, test) {
  const output = []
  const testing = []

  for (const item of array) {
    const promise = test(item).then((ok) => { if (ok) output.push(item) })

    testing.push(promise)
  }

  await Promise.all(testing)

  return output
}

exports.filter = filter
