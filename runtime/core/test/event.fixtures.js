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
