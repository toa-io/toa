'use strict'

// noinspection JSCheckFunctionSignatures
const operation = jest.fn((declaration) => {
  const { input, ...rest } = declaration

  return rest
})

const translate = { operation }

exports.translate = translate
