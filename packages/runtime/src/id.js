'use strict'

const uuid = require('uuid').v4

const id = () => {
  const buffer = Buffer.allocUnsafe(16)

  uuid({}, buffer)

  return buffer.toString('hex')
}

exports.id = id
