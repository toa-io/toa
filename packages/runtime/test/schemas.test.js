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

describe('null', () => {
  let nul

  beforeEach(() => {
    nul = schemas.add(null)
  })

  it('should fit null', () => {
    const { ok } = nul.fit(null)
    expect(ok).toBe(true)
  })

  it('should not fit not null', () => {
    expect(nul.fit(1).ok).toBe(false)
    expect(nul.fit('s').ok).toBe(false)
    expect(nul.fit({ o: 1 }).ok).toBe(false)
  })

  it('should return null as default', () => {
    expect(nul.defaults()).toBeNull()
  })
})
