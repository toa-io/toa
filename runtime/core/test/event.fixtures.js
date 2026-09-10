import { mock } from 'node:test'

import { generate } from 'randomstring'

export const definition = {
  conditioned: true,
  subjective: true
}

// noinspection JSCheckFunctionSignatures
export const bridge = {
  condition: mock.fn(async (origin) => !origin.falsy),
  payload: mock.fn(async () => ({ [generate()]: generate() }))
}

export const binding = {
  emit: mock.fn()
}

export const event = {
  origin: { [generate()]: generate() },
  state: { [generate()]: generate() },
  changeset: { [generate()]: generate() }
}

/** What the outbox hands a destination: the committed row, not its event alone. */
export const row = () => ({
  id: generate(),
  lane: 0,
  published: false,
  pending: 0,
  outstanding: ['events'],
  event
})
