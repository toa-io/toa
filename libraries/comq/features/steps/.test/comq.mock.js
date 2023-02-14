'use strict'

const { generate } = require('randomstring')

const io = () => ({
  close: jest.fn(async () => undefined)
})

const connect = jest.fn(async () => io())

exports.comq = { connect }
