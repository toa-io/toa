'use strict'

const pack = (content) => Buffer.from(JSON.stringify(content))
const unpack = (content) => JSON.parse(content)

exports.pack = pack
exports.unpack = unpack
