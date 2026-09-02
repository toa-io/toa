import { mock } from 'node:test'

import { generate } from 'randomstring'

const storage = {
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

const factory = {
  object: mock.fn(() => ({ [generate()]: generate() })),
  objects: mock.fn(() => ({ [generate()]: generate() }))
}

const query = generate()

const entity = {
  get: mock.fn(() => ({ [generate()]: generate() })),
  event: mock.fn(() => ({ state: { [generate()]: generate() } }))
}

const initial = {
  initial: true, ...entity
}

const unchanged = {
  ...entity,
  event: mock.fn(() => ({ state: { [generate()]: generate() } }))
}

// a legacy outbox: no storage capability, so `publish` emits inline
const outbox = {
  row: mock.fn((event) => ({ id: generate(), lane: 0, published: false, pending: 0, event })),
  publish: mock.fn()
}

export { storage, factory, outbox, query, entity, initial, unchanged }
