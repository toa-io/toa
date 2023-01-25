'use strict'

// noinspection JSCheckFunctionSignatures
const operation = jest.fn((declaration) => {
  const { input, ...sample } = declaration

  return { input, sample }
})

const translate = { operation }

exports.translate = translate
