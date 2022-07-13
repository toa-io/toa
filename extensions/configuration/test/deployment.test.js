'use strict'

const { encode } = require('@toa.io/libraries/generic')

const fixtures = require('./deployment.fixtures')
const { deployment } = require('../')

/** @type {toa.deployment.dependency.Declaration} */
let declaration

beforeAll(() => {
  declaration = deployment(fixtures.components, fixtures.annotations)
})

it('should exist', () => {
  expect(deployment).toBeDefined()
})

it('should declare variables', () => {
  expect(declaration.variables).toBeDefined()
})

it('should map configurations', () => {
  const keys = Object.keys(fixtures.annotations)

  expect(keys.length).toBeGreaterThan(0)

  for (const [id, annotations] of Object.entries(fixtures.annotations)) {
    const component = fixtures.find(id)
    const variables = declaration.variables[component.locator.label]
    const encoded = encode(annotations)

    expect(component).toBeDefined()
    expect(variables).toBeDefined()
    expect(variables).toBeInstanceOf(Array)
    expect(variables.length).toStrictEqual(1)

    const env = variables[0]

    expect(env.name).toBeDefined()
    expect(env.name).toStrictEqual('TOA_CONFIGURATION_' + component.locator.uppercase)
    expect(env.value).toBeDefined()
    expect(env.value).toStrictEqual(encoded)
  }
})
