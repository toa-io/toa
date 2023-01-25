'use strict'

const { generate } = require('randomstring')
const { flip } = require('@toa.io/libraries/generic')

const title = generate()
const input = generate()
const output = generate()
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

const events = { declaration: {}, sample: {} }
const label = generate()

events.declaration[label] = { [generate()]: generate() }
events.sample[label] = { payload: events.declaration[label] }

const extension = () => ([{ permanent: flip() }])

/** @type {toa.samples.Extensions} */
const extensions = { [generate()]: extension() }

/** @type {toa.samples.Operation} */
const declaration = {
  title,
  input,
  output,
  ...context.declaration,
  ...storage.declaration,
  events: events.declaration,
  extensions
}

/** @type {toa.sampling.Request} */
const expected = {
  input,
  sample: {
    autonomous: true,
    title,
    reply,
    context: context.sample,
    storage: storage.sample,
    events: events.sample,
    extensions
  }
}

exports.declaration = declaration
exports.expected = expected
