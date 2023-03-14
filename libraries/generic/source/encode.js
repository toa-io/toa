'use strict'

/** @type {toa.generic.Encode} */
const encode = (input) => {
  let value

  if (typeof input !== 'string') value = JSON.stringify(input)
  else value = input

  const buffer = Buffer.from(value)

  return buffer.toString(ENCODING)
}

/** @type {toa.generic.Decode} */
const decode = (input) => {
  const buffer = Buffer.from(input, ENCODING)
  const string = buffer.toString()

  try {
    return JSON.parse(string)
  } catch {
    return string
  }
}

/** @type {BufferEncoding} */
const ENCODING = 'base64'

exports.encode = encode
exports.decode = decode
