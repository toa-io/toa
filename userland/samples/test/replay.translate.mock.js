'use strict'

const { generate } = require('randomstring')

// noinspection JSCheckFunctionSignatures
const operation = jest.fn((declaration) => {
  const { input, ...sample } = declaration

  return { input, sample }
})

// noinspection JSCheckFunctionSignatures
const message = jest.fn((declaration) => generate())

const translate = { operation, message }

exports.translate = translate
