'use strict'

const { generate } = require('randomstring')

const context = /** @type {jest.MockedObject<Partial<toa.core.Context>>} */ {
  annexes: [generate(), generate()],
  apply: jest.fn(async () => generate()),
  call: jest.fn(async () => generate()),
  link: jest.fn()
}

const input = generate()
const request = () => ({ input })

const sample = () => ({
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
})

exports.context = context
exports.sample = sample
exports.request = request
