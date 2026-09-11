import { mock as tracker } from 'node:test'

import randomstring from 'randomstring'

export const schemas = {
  entity: { [randomstring.generate()]: randomstring.generate() },
  changeset: { [randomstring.generate()]: randomstring.generate() }
}

export const blank = { [randomstring.generate()]: randomstring.generate() }
export const storage = { id: tracker.fn(() => randomstring.generate()) }
export const entity = { [randomstring.generate()]: randomstring.generate() }
export const set = Array.from(Array(5)).map((_, index) => ({
  id: index,
  [randomstring.generate()]: randomstring.generate()
}))

// node:test records a mock's calls but not the instances it constructed
export const entities = []

const Entity = tracker.fn(function () {
  this.id = randomstring.generate()
  entities.push(this)
})

const EntitySet = tracker.fn(function () {})

export const mock = { Entity, EntitySet }
