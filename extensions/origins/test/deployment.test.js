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

/** @type {string} */
let origin

/** @type {toa.norm.context.dependencies.Instance} */
let component

beforeEach(() => {
  components = fixtures.components()

  component = sample(components)

  const origins = Object.keys(component.manifest)

  origin = sample(origins)
})

it('should create variables', async () => {
  const value = 'dev://' + generate()

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

it('should throw on annotation component mismatch', async () => {
  const id = generate()

  const annotations = {
    [id]: {
      [origin]: 'dev://' + generate()
    }
  }

  expect(() => deployment(components, annotations))
    .toThrow(`Origins annotations error: component '${id}' is not found`)
})

it('should throw on annotation origin mismatch', async () => {
  const id = component.locator.id
  const origin = generate()

  const annotations = {
    [id]: {
      [origin]: 'dev://' + generate()
    }
  }

  expect(() => deployment(components, annotations))
    .toThrow(`Origins annotations error: component '${id}' doesn't have '${origin}' origin`)
})

it('should throw if annotation is not valid', async () => {
  const annotations = /** @type {toa.origins.Annotations} */ { [component.locator.id]: generate() }

  expect(() => deployment(components, annotations)).toThrow('must be object')
})

it('should throw if annotation is URI is not valid', async () => {
  const annotations = {
    [component.locator.id]: {
      [origin]: 'hello!'
    }
  }

  expect(() => deployment(components, annotations)).toThrow('must match format')
})
