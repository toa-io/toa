'use strict'

const { randomUUID } = require('node:crypto')

const newid = () => {
  return randomUUID().replace(/-/g, '')
}

exports.newid = newid
