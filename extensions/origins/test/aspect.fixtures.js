'use strict'

const { generate } = require('randomstring')

const declaration = {
  origins: {
    foo: 'https://' + generate().toLowerCase(),
    amazon: 'https://*.*.amazon.com:*'
  }
}

const responses = []

const fetch = jest.fn(async () => {
  const response = responses.shift()

  if (response === undefined) throw new Error('Response is not mocked')

  return {
    status: response.status,
    json: () => response.body
  }
})

fetch.respond = (status, body) => {
  responses.push({ status, body })
}

fetch.reset = () => {
  responses.length = 0
}

exports.declaration = declaration
exports.mock = { fetch }
