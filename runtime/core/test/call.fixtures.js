import { mock } from 'node:test'

import { generate } from 'randomstring'

// noinspection JSCheckFunctionSignatures
export const transmission = {
  request: mock.fn((request) => ({ [request.invalid ? 'exception' : 'output']: generate() })),
  link: mock.fn()
}

export const contract = {
  fit: mock.fn(() => null)
}

export const request = () => ({
  ok: {
    input: { [generate()]: generate() },
    query: { [generate()]: generate() }
  },
  bad: {
    invalid: true
  }
})
