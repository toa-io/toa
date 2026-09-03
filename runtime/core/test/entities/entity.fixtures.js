import { mock } from 'node:test'

import { generate } from 'randomstring'

// noinspection JSCheckFunctionSignatures
export const schema = {
  fit: mock.fn((object) =>
    (object.fail ? { [generate()]: generate() } : null)),

  defaults: mock.fn(() => ({ [generate()]: generate() }))
}

export const state = () => ({
  id: generate(),
  foo: generate(),
  _created: generate(),
  _updated: generate(),
  _deleted: generate(),
  _version: 0
})

export const failed = () => ({
  ...state(),
  fail: true
})
