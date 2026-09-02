import { mock } from 'node:test'

import { generate } from 'randomstring'

// noinspection JSCheckFunctionSignatures
const schema = {
  fit: mock.fn((object) =>
    (object.fail ? { [generate()]: generate() } : null)),

  defaults: mock.fn(() => ({ [generate()]: generate() }))
}

const state = () => ({
  id: generate(),
  foo: generate(),
  _created: generate(),
  _updated: generate(),
  _deleted: generate(),
  _version: 0
})

const failed = () => ({
  ...state(),
  fail: true
})

export { schema, state, failed }
