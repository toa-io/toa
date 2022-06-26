'use strict'

/**
 * @param {Object} object
 * @returns {string}
 */
const encode = (object) => {
  const json = JSON.stringify(object)
  const buff = Buffer.from(json)

  return buff.toString(ENCODING)
}

/**
 * @param {string} string
 * @returns Object
 */
const decode = (string) => {
  const buff = Buffer.from(string, ENCODING)

  return JSON.parse(buff.toString())
}

const ENCODING = 'base64'

exports.encode = encode
exports.decode = decode
