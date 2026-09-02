import { mock } from 'node:test'

import { generate } from 'randomstring'

const binding = (index) => ({
  request: mock.fn(async (request) => {
    if (request?.pick !== undefined && request.pick !== index) return false

    return { output: generate() }
  })
})

const bindings = [0, 1, 2, 3, 4].map(binding)

export { bindings }
