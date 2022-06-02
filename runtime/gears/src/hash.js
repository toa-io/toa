'use strict'

// http://www.cse.yorku.ca/~oz/hash.html

/**
 * Hashes string
 * @param input {string}
 * @returns {string}
 */
const hash = (input) => {
  let hash = 5381
  let index = input.length

  while (index--) hash = hash * 33 ^ input.charCodeAt(index)

  // unsigned hex
  return (hash >>> 0).toString(16)
}

exports.hash = hash
