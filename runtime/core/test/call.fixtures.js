import { mock } from 'node:test'

import { generate } from 'randomstring'

// noinspection JSCheckFunctionSignatures
const transmission = {
  request: mock.fn((request) => ({ [request.invalid ? 'exception' : 'output']: generate() })),
  link: mock.fn()
}

const contract = {
  fit: mock.fn(() => null)
}

const request = () => ({
  ok: {
    input: { [generate()]: generate() },
    query: { [generate()]: generate() }
  },
  bad: {
    invalid: true
  }
})

export { transmission, contract, request }
