import { mock } from 'node:test'

import { generate } from 'randomstring'

export const configuration = { foo: { bar: generate() } }

export const context = /** @type {import('@toa.io/core').Context} */ {
  apply: mock.fn(),
  call: mock.fn(),
  aspects: [
    {
      name: 'configuration',
      invoke: mock.fn(() => configuration)
    }
  ],
  link: mock.fn(),
  connect: mock.fn()
}
