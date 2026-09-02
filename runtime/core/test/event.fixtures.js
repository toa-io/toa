import { mock } from 'node:test'

import { generate } from 'randomstring'

const definition = {
  conditioned: true,
  subjective: true
}

// noinspection JSCheckFunctionSignatures
const bridge = {
  condition: mock.fn(async (origin) => !origin.falsy),
  payload: mock.fn(async () => ({ [generate()]: generate() }))
}

const binding = {
  emit: mock.fn()
}

const event = {
  origin: { [generate()]: generate() },
  state: { [generate()]: generate() },
  changeset: { [generate()]: generate() }
}

export { bridge, binding, definition, event }
