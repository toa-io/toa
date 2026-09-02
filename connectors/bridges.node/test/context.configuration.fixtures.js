import { mock } from 'node:test'

import { generate } from 'randomstring'

const configuration = { foo: { bar: generate() } }

const context = /** @type {toa.core.Context} */ {
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

export { context, configuration }
