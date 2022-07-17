'use strict'

const { resolve } = require('node:path')
const { generate } = require('randomstring')
const { dump } = require('@toa.io/libraries/yaml')

const { gherkin } = require('@toa.io/libraries/mock')

const fixtures = require('./connectors.fixtures')
const mock = { gherkin, boot: fixtures.mock.boot }

jest.mock('@cucumber/cucumber', () => mock.gherkin)
jest.mock('@toa.io/boot', () => mock.boot)
require('../connectors')

describe('When I boot {component} component', () => {
  const step = gherkin.steps.Wh('I boot {component} component')

  it('should be', () => undefined)

  it('should connect component', async () => {
    const COLLECTION = resolve(__dirname, '../.workspace/components/collection')

    /** @type {toa.features.Context} */
    const context = { cwd: generate() }
    const reference = generate()
    const path = resolve(COLLECTION, reference)

    await step.call(context, reference)

    expect(mock.boot.component).toHaveBeenCalledWith(path)

    const manifest = mock.boot.component.mock.results[0].value

    expect(mock.boot.runtime).toHaveBeenCalledWith(manifest)

    const runtime = mock.boot.runtime.mock.results[0].value

    expect(context.connector).toStrictEqual(runtime)
  })
})

describe('When I invoke {word} with:', () => {
  const step = gherkin.steps.Wh('I invoke {word} with:')

  it('should be', () => undefined)

  /** @type {toa.features.Context} */
  let context

  beforeEach(() => {
    const connector = /** @type {toa.core.Runtime} */ {
      invoke: jest.fn(() => generate())
    }

    context = { connector }
  })

  it('should invoke', async () => {
    const endpoint = generate()
    const request = { [generate()]: generate() }
    const yaml = dump(request)

    await step.call(context, endpoint, yaml)

    const connector = /** @type {toa.core.Runtime} */ context.connector

    expect(connector.invoke).toHaveBeenCalledWith(endpoint, request)
  })
})
