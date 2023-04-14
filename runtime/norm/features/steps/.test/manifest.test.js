'use strict'

const { AssertionError } = require('assert')
const { generate } = require('randomstring')
const { dump } = require('@toa.io/yaml')
const gherkin = require('@toa.io/tomato')

const mock = { gherkin }

jest.mock('@cucumber/cucumber', () => mock.gherkin)
require('../manifest')

it('should be', () => undefined)

/** @type {toa.norm.features.Context} */
let context

beforeEach(() => {
  const manifest = /** @type {toa.norm.component.Declaration} */ {
    name: 'test',
    namespace: 'features',
    version: '1.0.0',
    entity: null
  }

  context = { manifest }
})

describe('Given I have an entity schema:', () => {
  const step = gherkin.steps.Gi('I have an entity schema:')

  it('should be', () => undefined)

  it('should set entity schema', () => {
    const schema = { foo: 'string' }
    const yaml = dump(schema)

    step.call(context, yaml)

    expect(context.manifest.entity).toStrictEqual({ schema })
  })
})

describe('When I declare {operation} with:', () => {
  const step = gherkin.steps.Wh('I declare {operation} with:')

  it('should be', () => undefined)

  it('should declare operation', () => {
    const type = 'assignment'
    const scope = 'changeset'
    const input = {}
    const yaml = dump(input)

    step.call(context, type, yaml)

    expect(context.manifest.operations[type]).toStrictEqual({ type, scope })
  })
})

describe('Then normalized {operation} declaration must contain:', () => {
  const step = gherkin.steps.Th('normalized {operation} declaration must contain:')

  it('should be', () => undefined)

  it('should throw if does not contain', async () => {
    const type = 'assignment'

    context.manifest.operations = {
      [type]: {
        type,
        input: { bar: 'number' },
        scope: 'changeset'
      }
    }

    const input = {
      type: 'object',
      properties: {
        bar: { type: 'string' }
      }
    }

    const yaml = dump({ input })

    await expect(step.call(context, type, yaml)).rejects.toThrow(AssertionError)
  })

  it('should not throw if contain', async () => {
    const type = 'assignment'

    context.manifest.operations = {
      [type]: {
        type,
        input: { bar: 'number' },
        scope: 'changeset'
      }
    }

    const input = {
      type: 'object',
      properties: {
        bar: { type: 'number' }
      }
    }

    const yaml = dump({ input })

    await expect(step.call(context, type, yaml)).resolves.not.toThrow()
  })
})
