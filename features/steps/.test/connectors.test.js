'use strict'

const { resolve } = require('node:path')
const { generate } = require('randomstring')
const { transpose } = require('@toa.io/generic')
const { dump } = require('@toa.io/yaml')
const { AssertionError } = require('node:assert')

const { gherkin } = require('@toa.io/mock')

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

    expect(mock.boot.manifest.mock.calls[0][0]).toStrictEqual(path)

    const manifest = mock.boot.manifest.mock.results[0].value

    expect(mock.boot.component).toHaveBeenCalledWith(manifest)

    const component = mock.boot.component.mock.results[0].value

    expect(context.connector).toStrictEqual(component)
  })
})

describe('When I compose {component} component', () => {
  const step = gherkin.steps.Wh('I compose {component} component')

  it('should be', () => undefined)

  it('should create composition', async () => {
    /** @type {toa.features.Context} */
    const context = {}
    const reference = generate()
    const path = resolve(COLLECTION, reference)

    await step.call(context, reference)

    expect(mock.boot.composition).toHaveBeenCalledWith([path], expect.any(Object))

    const composition = mock.boot.composition.mock.results[0].value

    expect(composition.connect).toHaveBeenCalled()
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

    expect(mock.boot.composition).toHaveBeenCalledWith(paths, expect.any(Object))

    const composition = mock.boot.composition.mock.results[0].value

    expect(composition.connect).toHaveBeenCalled()
  })
})

describe('When I invoke {token}', () => {
  const step = gherkin.steps.Wh('I invoke {token}')

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

    expect(context.reply).toStrictEqual(output)
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
      invoke: jest.fn(() => generate())
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
})

describe('When I call {endpoint} with:', () => {
  const step = gherkin.steps.Wh('I call {endpoint} with:')

  it('should be', () => undefined)

  const namespace = generate()
  const name = generate()
  const operation = generate()
  const endpoint = `${namespace}.${name}.${operation}`
  const request = { [generate()]: generate() }
  const yaml = dump(request)
  /** @type {toa.features.Context} */
  const context = {}

  it('should call remote', async () => {
    await step.call(context, endpoint, yaml)

    expect(mock.boot.remote).toHaveBeenCalled()

    const remote = mock.boot.remote.mock.results[0].value

    expect(remote.invoke).toHaveBeenCalledWith(operation, request)

    expect(remote.disconnect).toHaveBeenCalled()
  })

  it('should set reply', async () => {
    await step.call(context, endpoint, yaml)

    const remote = mock.boot.remote.mock.results[0].value

    expect(context.reply).toStrictEqual(await remote.invoke.mock.results[0].value)
  })

  it('should set exception', async () => {
    const exception = new Error(generate())
    const invoke = () => { throw exception }
    const connect = () => undefined
    const disconnect = () => undefined

    // noinspection JSCheckFunctionSignatures
    mock.boot.remote.mockResolvedValueOnce({ connect, disconnect, invoke })

    await step.call(context, endpoint, yaml)

    expect(context.exception).toBeDefined()
    expect(context.exception).toStrictEqual(exception)
  })
})

describe('When I call {endpoint}', () => {
  const step = gherkin.steps.Wh('I call {endpoint}')

  it('should be', async () => undefined)

  const namespace = generate()
  const name = generate()
  const operation = generate()
  const endpoint = `${namespace}.${name}.${operation}`
  const context = {}

  it('should call remote', async () => {
    await step.call(context, endpoint)

    expect(mock.boot.remote).toHaveBeenCalled()

    const remote = mock.boot.remote.mock.results[0].value

    expect(remote.invoke).toHaveBeenCalledWith(operation, {})

    expect(remote.disconnect).toHaveBeenCalled()
  })

  it('should set reply', async () => {
    await step.call(context, endpoint)

    const remote = mock.boot.remote.mock.results[0].value

    expect(context.reply).toStrictEqual(await remote.invoke.mock.results[0].value)
  })
})

describe('Then the reply is received:', () => {
  const step = gherkin.steps.Th('the reply is received:')

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

describe('Then the reply is received', () => {
  const step = gherkin.steps.Th('the reply is received')

  /** @type {toa.features.Context} */
  let context

  beforeEach(() => {
    context = {}
  })

  it('should be', async () => undefined)

  it('should fail if reply is not received', async () => {
    expect(() => step.call(context)).toThrow(AssertionError)
  })

  it('should pass if reply is received', async () => {
    context.reply = {}

    expect(() => step.call(context)).not.toThrow()
  })
})

describe('Then the following exception is thrown:', () => {
  const step = gherkin.steps.Th('the following exception is thrown:')

  /** @type {toa.features.Context} */
  let context

  beforeEach(() => {
    context = {}
  })

  it('should be', async () => undefined)

  it('should fail if not matches', async () => {
    context.exception = { code: 1, message: generate() }

    const expected = { code: 0, message: generate() }
    const yaml = dump(expected)

    expect(() => step.call(context, yaml)).toThrow(AssertionError)
  })

  it('should pass if matches', async () => {
    context.exception = { code: 1, message: generate() }

    const yaml = dump(context.exception)

    expect(() => step.call(context, yaml)).not.toThrow()

  })
})

describe('When an event {label} is emitted with the payload:', () => {
  gherkin.steps.Wh('an event {label} is emitted with the payload:')

  it('should be', async () => undefined)
})

const COLLECTION = resolve(__dirname, '../.workspace/components/collection')
