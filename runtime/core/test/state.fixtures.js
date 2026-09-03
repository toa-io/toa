import { mock } from 'node:test'

import { generate } from 'randomstring'

export const storage = {
  name: 'dummy',
  get: mock.fn(() => ({ id: generate() })),
  find: mock.fn(() => ([{ id: generate() }])),
  add: mock.fn(() => true),
  set: mock.fn(() => true),
  store: mock.fn(() => true),
  massStore: mock.fn(() => true),
  upsert: mock.fn(() => ({ id: generate() })),
  ensure: mock.fn((query, properties, state) => state)
}

export const factory = {
  object: mock.fn(() => ({ [generate()]: generate() })),
  objects: mock.fn(() => ({ [generate()]: generate() }))
}

export const query = generate()

export const entity = {
  get: mock.fn(() => ({ [generate()]: generate() })),
  event: mock.fn(() => ({ state: { [generate()]: generate() } }))
}

export const initial = {
  initial: true, ...entity
}

export const unchanged = {
  ...entity,
  event: mock.fn(() => ({ state: { [generate()]: generate() } }))
}

// a legacy outbox: no storage capability, so `publish` emits inline
export const outbox = {
  row: mock.fn((event) => ({ id: generate(), lane: 0, published: false, pending: 0, event })),
  publish: mock.fn()
}
