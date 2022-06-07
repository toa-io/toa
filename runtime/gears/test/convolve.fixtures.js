'use strict'

const { generate } = require('randomstring')

const origin = {
  foo: generate(),
  bar: {
    baz: generate()
  },
  quu: [generate(), generate()]
}

exports.origin = origin
