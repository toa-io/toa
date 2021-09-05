'use strict'

const pack = (content) => {
  return Buffer.from(JSON.stringify(content))
}

const unpack = (content) => {
  return JSON.parse(content)
}

exports.pack = pack
exports.unpack = unpack
