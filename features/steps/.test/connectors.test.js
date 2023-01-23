'use strict'

const { resolve } = require('node:path')
const { generate } = require('randomstring')
const { transpose } = require('@toa.io/libraries/generic')
const { dump } = require('@toa.io/libraries/yaml')
const { AssertionError } = require('node:assert')

const { gherkin } = require('@toa.io/libraries/mock')

const fixtures = require('./connectors.fixtures')
const mock = { gherkin, boot: fixtures.mock.boot }

jest.mock('@cucumber/cucumber', () => mock.gherkin)
jest.mock('@toa.io/boot', () => mock.boot)
require('../connectors')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('When I boot {component} component', () => {
  const step = gherkin.steps.Wh('I boot {component} component')

  it('should be', () => undefined)

  it('should connect component', async () => {
    /** @type {toa.features.Context} */
    const context = { cwd: generate() }
    const reference = generate()
    const path = resolve(COLLECTION, reference)

    await step.call(context, reference)

    expect(mock.boot.manifest).toHaveBeenCalledWith(path)

    const manifest = mock.boot.manifest.mock.results[0].value

    expect(mock.boot.component).toHaveBeenCalledWith(manifest)

    const component = mock.boot.component.mock.results[0].value

    expect(context.connector).toStrictEqual(component)
  })
})

describe('When I compose {word} component', () => {
  const step = gherkin.steps.Wh('I compose {component} component')

  it('should be', () => undefined)

  it('should create composition', async () => {
    /** @type {toa.features.Context} */
    const context = {}
    const reference = generate()
    const path = resolve(COLLECTION, reference)

    await step.call(context, reference)

    expect(mock.boot.composition).toHaveBeenCalledWith([path])

    const composition = mock.boot.composition.mock.results[0].value

    expect(composition.connect).toHaveBeenCalled()
    expect(context.connector).toStrictEqual(composition)
  })
})

describe('When I compose components:', () => {
  const step = gherkin.steps.Wh('I compose components:')

  it('should be', () => undefined)

  it('should create composition', async () => {
    const context = {}
    const references = ['dummies.one', 'dummies.two']
    const cells = transpose(references)
    const data = gherkin.table(cells)
    const paths = references.map((reference) => resolve(COLLECTION, reference))

    await step.call(context, data)

    expect(mock.boot.composition).toHaveBeenCalledWith(paths)

    const composition = mock.boot.composition.mock.results[0].value

    expect(composition.connect).toHaveBeenCalled()
    expect(context.connector).toStrictEqual(composition)
  })
})

describe('When I invoke {word}', () => {
  const step = gherkin.steps.Wh('I invoke {word}')

  it('should be', () => undefined)

  /** @type {toa.features.Context} */
  let context

  let connector
  let endpoint
  let output

  beforeEach(() => {
    output = generate()

    connector = /** @type {toa.core.Component} */ {
      invoke: jest.fn(() => ({ output }))
    }

    context = { connector }

    endpoint = generate()
  })

  it('should invoke', async () => {
    await step.call(context, endpoint)

    expect(connector.invoke).toHaveBeenCalledWith(endpoint, {})
  })

  it('should set reply ', async () => {
    await step.call(context, endpoint)

    expect(context.reply).toMatchObject({ output })
  })
})

describe('When I invoke {token} with:', () => {
  const step = gherkin.steps.Wh('I invoke {token} with:')

  it('should be', () => undefined)

  /** @type {toa.features.Context} */
  let context

  let connector

  beforeEach(() => {
    connector = /** @type {toa.core.Component} */ {
      invoke: jest.fn(() => ({ output: generate() }))
    }

    context = { connector }
  })

  it('should invoke', async () => {
    const endpoint = generate()
    const request = { [generate()]: generate() }
    const yaml = dump(request)

    await step.call(context, endpoint, yaml)

    expect(connector.invoke).toHaveBeenCalledWith(endpoint, request)
  })

  it('should throw if exception', async () => {
    const exception = { message: generate() }

    connector.invoke.mockImplementationOnce(() => ({ exception }))

    await expect(step.call(context, 'any', {})).rejects.toThrow(exception.message)
  })
})

describe('When I call {endpoint} with:', () => {
  const step = gherkin.steps.Wh('I call {endpoint} with:')

  it('should be', () => undefined)

  it('should call remote', async () => {
    const namespace = generate()
    const name = generate()
    const operation = generate()
    const endpoint = `${namespace}.${name}.${operation}`
    const request = { [generate()]: generate() }
    const yaml = dump(request)
    const context = {}

    await step.call(context, endpoint, yaml)

    expect(mock.boot.remote).toHaveBeenCalled()

    const remote = mock.boot.remote.mock.results[0].value

    expect(remote.invoke).toHaveBeenCalledWith(operation, request)

    expect(remote.disconnect).toHaveBeenCalled()
  })
})

describe('Then the reply should match:', () => {
  const step = gherkin.steps.Th('the reply should match:')

  it('should be', () => undefined)

  it('should throw if does not match', () => {
    const context = { reply: generate() }
    const object = generate()
    const yaml = dump(object)

    expect(() => step.call(context, yaml)).toThrow(AssertionError)
  })

  it('should not throw if match', () => {
    const context = { reply: generate() }
    const yaml = dump(context.reply)

    expect(() => step.call(context, yaml)).not.toThrow()
  })
})

const COLLECTION = resolve(__dirname, '../.workspace/components/collection')
