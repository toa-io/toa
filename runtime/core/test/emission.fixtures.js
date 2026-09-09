import { mock } from 'node:test'

import { generate } from 'randomstring'

// noinspection JSCheckFunctionSignatures
export const events = [0, 1, 2].map((index) => ({
  emit: mock.fn(async (row) => ({ ...row, event: index }))
}))

/** What the outbox hands a destination: the committed row, not its event alone. */
export const row = {
  id: generate(),
  lane: 0,
  published: false,
  pending: 0,
  outstanding: ['events'],
  trail: ['default.orders.place'],
  event: {
    origin: { [generate()]: generate() },
    state: { [generate()]: generate() }
  }
}
