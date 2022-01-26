'use strict'

// http://www.cse.yorku.ca/~oz/hash.html

exports.hash = (str) => {
  if (typeof str !== 'string') throw new TypeError('hash() argument must be a string')

  let hash = 5381
  let index = str.length

  while (index--) hash = hash * 33 ^ str.charCodeAt(index)

  // unsigned hex
  return (hash >>> 0).toString(16)
}
