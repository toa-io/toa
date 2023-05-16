'use strict'

const clone = require('clone-deep')
const { generate } = require('randomstring')
const { AssertionError } = require('node:assert')

const mock = require('@toa.io/mock')
const { sample } = require('@toa.io/generic')
const { dump } = require('@toa.io/yaml')

const fixtures = require('./kubespec.fixtures')

jest.mock('@cucumber/cucumber', () => mock.gherkin)

require('../kubespec.js')

const gherkin = mock.gherkin

let context
let specs

it('should be', () => undefined)

beforeEach(() => {
  context = { stdout: fixtures.yaml }
  specs = clone(fixtures.specs)
})

describe('Then {word} {word} {word} spec should contain:', () => {
  const step = gherkin.steps.Th('{word} {word} {word} spec should contain:')

  let spec
  let kind
  let name

  beforeEach(() => {
    spec = sample(specs)
    kind = spec.kind
    name = spec.metadata.name
  })

  it('should be', () => {
    expect(step).toBeDefined()
  })

  it('should throw if unknown node', async () => {
    const node = generate()
    const reference = 'foo: bar'

    await expect(step.call(context, name, kind, node, reference)).rejects.toThrow('Unknown node')
  })

  describe('container', () => {
    const node = 'container'

    it('should pass if container contains', async () => {
      const env = spec.spec.template.spec.containers[0].env
      const reference = dump({ env })

      await step.call(context, name, kind, node, reference)
    })

    it('should fail if container not contains', async () => {
      const reference = dump({ [generate()]: generate() })

      await expect(step.call(context, name, kind, node, reference)).rejects.toThrow(AssertionError)
    })
  })
})
