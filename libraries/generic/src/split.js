'use strict'

/**
 * Split string respecting quotes
 *
 * @param {string} string
 * @returns {string[]}
 */
const split = (string) => {
  const array = []

  let match

  while ((match = RX.exec(string)) !== null) {
    if (match[1] !== undefined) array.push(match[1])
    else if (match[2] !== undefined) array.push(match[2])
    else array.push(match[0])
  }

  return array
}

const RX = /[^\s"']+|"([^"]*)"|'([^']*)'/g

exports.split = split
