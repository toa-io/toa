import { mock } from 'node:test'

import { generate } from 'randomstring'

// noinspection JSCheckFunctionSignatures
export const events = [0, 1, 2].map((index) => ({
  emit: mock.fn(async (state) => ({ ...state, event: index }))
}))

export const event = {
  origin: { [generate()]: generate() },
  state: { [generate()]: generate() }
}
