export function encode (input) {
  if (typeof input !== 'string')
    input = JSON.stringify(input)

  return Buffer.from(input).toString(ENCODING)
}

export function decode (input) {
  const string = Buffer.from(input, ENCODING).toString()

  try {
    return JSON.parse(string)
  } catch {
    return string
  }
}

/** @type {BufferEncoding} */
const ENCODING = 'base64'
