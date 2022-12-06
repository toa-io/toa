'use strict'

const { generate } = require('randomstring')
const { flip } = require('@toa.io/libraries/generic')

const title = generate()
const input = generate()
const output = generate()
const request = { input }
const reply = { output }

const context = {}

context.declaration = {
  local: {
    do: {
      input: generate(),
      output: generate()
    },
    undo: [
      {
        input: generate()
      },
      {
        output: generate()
      }
    ]
  }
}

context.sample = {
  local: {
    do: [
      {
        request: {
          input: context.declaration.local.do.input
        },
        reply: {
          output: context.declaration.local.do.output
        }
      }
    ],
    undo: [
      {
        request: {
          input: context.declaration.local.undo[0].input
        }
      },
      {
        reply: {
          output: context.declaration.local.undo[1].output
        }
      }
    ]
  }
}

const storage = {}

storage.declaration = {
  current: flip() ? { foo: generate() } : [{ foo: generate() }], // object or array
  next: { foo: generate() }
}

storage.sample = {
  current: storage.declaration.current,
  next: storage.declaration.next
}

const events = {}
const label = generate()

events[label] = { [generate()]: generate() }

const extension = () => ([{ permanent: flip() }])

/** @type {toa.samples.Extensions} */
const extensions = { [generate()]: extension() }

/** @type {toa.samples.Declaration} */
const declaration = {
  title,
  input,
  output,
  ...context.declaration,
  ...storage.declaration,
  events,
  extensions
}

/** @type {toa.samples.Sample} */
const expected = {
  title,
  request,
  reply,
  context: context.sample,
  storage: storage.sample,
  events,
  extensions
}

exports.declaration = declaration
exports.expected = expected
