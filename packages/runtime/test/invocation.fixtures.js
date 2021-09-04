'use strict'

const randomstring = require('randomstring')

const call = {
  invoke: jest.fn(() => [{ [randomstring.generate()]: randomstring.generate() }, null])
}

const io = {
  create: jest.fn((input) => {
    let ok = true
    let oh

    const io = { input, output: {}, error: {}, fit: jest.fn() }

    if (input?.invalid) {
      ok = false
      oh = { message: randomstring.generate() }
    }

    return { ok, oh, io }
  })
}

const query = {
  parse: jest.fn((query) => {
    if (query?.invalid) return [null, { [randomstring.generate()]: randomstring.generate() }]
    else return [{ [randomstring.generate()]: randomstring.generate() }]
  })
}

const sample = () => ({
  input: {
    ok: { [randomstring.generate()]: randomstring.generate() },
    invalid: { invalid: true }
  },
  query: {
    ok: randomstring.generate(),
    invalid: { invalid: true }
  }
})

exports.call = call
exports.io = io
exports.query = query
exports.sample = sample
