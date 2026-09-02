import { mock } from 'node:test'

import randomstring from 'randomstring'

const schema = { [randomstring.generate()]: randomstring.generate() }
const storage = { id: mock.fn(() => randomstring.generate()) }
const entity = { [randomstring.generate()]: randomstring.generate() }
const set = Array.from(Array(5))
  .map((_, index) => ({ id: index, [randomstring.generate()]: randomstring.generate() }))

// node:test records a mock's calls but not the instances it constructed
const entities = []

const Entity = mock.fn(function () {
  this.id = randomstring.generate()
  entities.push(this)
})

const EntitySet = mock.fn(function () {})







// named `mock` for its consumers, which is what node:test calls its own tracker
const mocks = { Entity, EntitySet }

export { schema, storage, entity, set, entities, mocks as mock }
