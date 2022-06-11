'use strict'

const { generate } = require('randomstring')

const declaration = {
  origins: {
    foo: 'https://' + generate().toLowerCase(),
    amazon: 'https://*.*.amazon.com'
  }
}

const fetch = jest.fn(async () => {
  return generate()
})

exports.declaration = declaration
exports.mock = { fetch }
