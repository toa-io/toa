'use strict'

const { generate } = require('randomstring')

/** @type {toa.pointer.URIs} */
const declaration = {
  foo: 'https://' + generate().toLowerCase(),
  amazon: 'https://*.*.amazon.com:*',
  deep: 'http://www.domain.com/some/path/'
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
