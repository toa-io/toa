import { mock } from 'node:test'

import { generate } from 'randomstring'

// noinspection JSCheckFunctionSignatures
const events = [0, 1, 2].map((index) => ({
  emit: mock.fn(async (state) => ({ ...state, event: index }))
}))

const event = {
  origin: { [generate()]: generate() },
  state: { [generate()]: generate() }
}

export { events, event }
