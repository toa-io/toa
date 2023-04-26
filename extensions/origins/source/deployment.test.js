'use strict'

const { generate } = require('randomstring')
const { sample, letters: { up } } = require('@toa.io/generic')

const fixtures = require('./.test/deployment.fixtures')
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

describe('validation', () => {
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
})

it('should create variables', () => {
  const value = 'dev://' + generate()

  /** @type {toa.origins.Annotations} */
  const annotations = {
    [component.locator.id]: {
      [origin]: value
    }
  }

  const output = deployment(components, annotations)

  expect(output.variables).not.toBeUndefined()

  const variables = output.variables[component.locator.label]
  const varName = 'TOA_ORIGINS_' + component.locator.uppercase
  const variable = findVariable(variables, varName)

  expect(variable).toBeDefined()

  const json = JSON.stringify(annotations[component.locator.id])
  const base64 = btoa(json)

  expect(variable.value).toStrictEqual(base64)
})

describe('amqp', () => {
  beforeEach(() => {
    const amqpComponents = components.filter(
      (component) => {
        const origin = Object.keys(component.manifest)
        const url = new URL(component.manifest[origin])

        return url.protocol === 'amqp:' || url.protocol === 'amqps:'
      }
    )

    component = sample(amqpComponents)

    const origins = Object.keys(component.manifest)

    origin = sample(origins)
  })

  it('should create credential secrets', () => {
    /** @type {toa.origins.Annotations} */
    const annotations = {
      [component.locator.id]: {
        [origin]: 'amqps://whatever'
      }
    }

    const output = deployment(components, annotations)
    const variables = output.variables[component.locator.label]

    expect(variables).toBeDefined()

    const envPrefix = `TOA_ORIGINS_${component.locator.uppercase}_${up(origin)}_`
    const secretName = `toa-origins-${component.locator.label}-${origin}`

    for (const property of ['username', 'password']) {
      const variableName = envPrefix + up(property)
      const variable = findVariable(variables, variableName)

      expect(variable).toBeDefined()

      expect(variable.secret).toStrictEqual({
        name: secretName,
        key: property
      })
    }
  })
})

describe('http', () => {
  it('should not throw on properties', async () => {
    const annotations = {
      [component.locator.id]: {
        '.http': {
          null: true
        },
        [origin]: 'amqps://whatever'
      }
    }

    expect(() => deployment(components, annotations)).not.toThrow()
  })
})

/**
 * @param {toa.deployment.dependency.Variable[]} variables
 * @param {string} name
 * @returns {toa.deployment.dependency.Variable}
 */
function findVariable (variables, name) {
  return variables.find((variable) => variable.name === name)
}
