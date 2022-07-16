'use strict'

const { resolve } = require('node:path')
const { generate } = require('randomstring')

const { gherkin } = require('@toa.io/libraries/mock')

const fixtures = require('./connectors.fixtures')
const mock = { gherkin, boot: fixtures.mock.boot }

jest.mock('@cucumber/cucumber', () => mock.gherkin)
jest.mock('@toa.io/boot', () => mock.boot)
require('../connectors')

describe('component', () => {
  const step = gherkin.steps.Wh('I boot {component} component')

  it('should be', () => undefined)

  it('should boot component', async () => {
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
