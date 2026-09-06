import { mock } from 'node:test'

import { generate } from 'randomstring'

export const definition = /** @type {toa.norm.component.Receiver} */ {
  operation: generate(),
  conditioned: false,
  adaptive: false
}

export const local = /** @type {import('@toa.io/core').Component} */ {
  locator: { id: 'default.dummy' },
  invoke: mock.fn()
}

// noinspection JSCheckFunctionSignatures
export const bridge = /** @type {import('@toa.io/core/types').bridges.Event} */ {
  condition: mock.fn(async (payload) => !(payload.reject === true)),
  request: mock.fn(async () => ({ input: generate() }))
}
