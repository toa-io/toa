'use strict'

const { generate } = require('randomstring')

const aspect = () => ({
  name: generate(),
  invoke: jest.fn(async () => generate())
})

const context = /** @type {jest.MockedObject<Partial<toa.core.Context>>} */ {
  aspects: [aspect(), aspect()],
  apply: jest.fn(async () => generate()),
  call: jest.fn(async () => generate()),
  link: jest.fn()
}

const input = generate()
const request = () => ({ input })

const sample = () => ({
  context: {
    local: {
      do: [
        {
          request: {
            input
          },
          reply: {
            output: generate()
          }
        }
      ]
    },
    remote: {
      'dummies.dummy.do': [
        {
          request: {
            input
          },
          reply: {
            output: generate()
          }
        }
      ]
    }
  }
})

exports.context = context
exports.sample = sample
exports.request = request
