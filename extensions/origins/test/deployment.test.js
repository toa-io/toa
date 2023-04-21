'use strict'

const { generate } = require('randomstring')
const { sample } = require('@toa.io/generic')

const fixtures = require('./deployment.fixtures')
const { deployment } = require('../')

it('should be', async () => {
  expect(deployment).toBeInstanceOf(Function)
})

/** @type {toa.norm.context.dependencies.Instance[]} */
let components

beforeEach(() => {
  components = fixtures.components()
})

it('should create variables', async () => {
  const component = sample(components)
  const origins = Object.keys(component.manifest)
  const origin = sample(origins)
  const value = generate()

  /** @type {toa.origins.Annotations} */
  const annotations = {
    [component.locator.id]: {
      [origin]: value
    }
  }

  const json = JSON.stringify(annotations[component.locator.id])
  const base64 = btoa(json)

  const output = deployment(components, annotations)

  expect(output.variables).not.toBeUndefined()
  expect(output.variables[component.locator.label]).toBeInstanceOf(Array)
  expect(output.variables[component.locator.label].length).toStrictEqual(1)

  const variable = output.variables[component.locator.label][0]

  expect(variable.name).toStrictEqual('TOA_ORIGINS_' + component.locator.uppercase)
  expect(variable.value).toStrictEqual(base64)
})

it('should throw on annotation mismatch', async () => {

})
