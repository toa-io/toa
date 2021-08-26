'use strict'

const { Schemas } = require('../src/schemas')
const fixtures = require('./schemas.fixtures')

let schemas
let schema

beforeEach(() => {
  schemas = new Schemas()
  schemas.add(fixtures.schemas.parent)
  schema = schemas.add(fixtures.schemas.dependant)

  schemas.compile()
})

it('should validate', () => {
  const ok = schema.fit(fixtures.samples.ok)
  expect(ok.ok).toBe(true)

  const oh = schema.fit(fixtures.samples.invalid)
  expect(oh.ok).toBe(false)
})

it('should set defaults', () => {
  const value = { id: 1 }

  schema.fit(value)

  expect(value.name).toBe(fixtures.schemas.dependant.properties.name.default)
})

it('should object with defaults', () => {
  const value = schema.defaults()

  expect(value).toEqual({ name: fixtures.schemas.dependant.properties.name.default })
})
