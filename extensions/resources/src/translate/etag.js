'use strict'

const get = (header) => {
  const match = header.match(rx)
  return match === null ? null : match[1]
}

const set = (value) => '"' + value + '"'

const rx = /^"([^"]+)"$/

exports.get = get
exports.set = set
exports.rx = rx
