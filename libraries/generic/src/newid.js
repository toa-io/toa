'use strict'

const uuid = require('uuid').v4

/** @type {toa.generic.Identify} */
const newid = () => {
  const buffer = Buffer.allocUnsafe(16)

  uuid({}, buffer)

  return buffer.toString('hex')
}

exports.newid = newid
