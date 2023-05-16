'use strict'

const clone = require('clone-deep')
const { encode, sample } = require('@toa.io/generic')

const fixtures = require('./deployment.fixtures')
const { deployment } = require('../')
const { generate } = require('randomstring')

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

it('should declare secrets', async () => {
  const annotations = clone(fixtures.annotations)
  const component = sample(fixtures.components)
  const id = component.locator.id
  const key = generate()
  const name = generate().substring(0, 16).toUpperCase()
  const value = '$' + name

  if (annotations[id] === undefined) annotations[id] = {}

  annotations[id][key] = value

  declaration = deployment(fixtures.components, annotations)

  const variables = declaration.variables[component.locator.label]

  expect(variables).toBeDefined()

  const secret = variables.find((variable) => variable.name === 'TOA_CONFIGURATION__' + name)

  expect(secret).toBeDefined()
})
