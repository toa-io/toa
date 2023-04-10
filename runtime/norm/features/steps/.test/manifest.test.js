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
  const manifest = {
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

describe('When I declare operation {operation} with:', () => {
  const step = gherkin.steps.Wh('I declare operation {operation} with:')

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

describe('When I declare receiver for {label} with:', () => {
  const step = gherkin.steps.Wh('I declare receiver for {label} with:')

  it('should be', () => undefined)

  it('should declare receiver', () => {
    const event = 'assignment'
    const input = {
      binding: 'amqp'
    }
    const yaml = dump(input)

    step.call(context, event, yaml)
    expect(context.manifest.receivers[event]).toStrictEqual(input)
  })

})

describe('Then normalized receiver for event {label} must contain:', () => {
  const step = gherkin.steps.Th('normalized receiver for event {label} must contain:')

  it('should be', () => undefined)

  it('should throw if does not contain', async () => {
    const label = generate()
    const operation = generate();

    context.manifest.operations = {
        [operation]: {
          type: 'transition',
          scope: 'object',
          concurrency: 'none'
        }
    }

    context.manifest.receivers = {
      [label]: {
        path: '',
        bridge: 'node',
        transition: operation,
        binding: 'amqp'
      }
    }

    const input = {
      binding: 'sql',
    }

    const yaml = dump({ input })

    await expect(step.call(context, label, yaml)).rejects.toThrow(AssertionError)
  })

  it('should not throw if contain', async () => {
    const label = generate()
    const operation = generate();

    context.manifest.operations = {
      [operation]: {
        type: 'transition',
        scope: 'object',
        concurrency: 'none'
      }
    }

    context.manifest.receivers = {
      [label]: {
        path: '',
        bridge: 'node',
        transition: operation,
        binding: 'amqp'
      }
    }

    const yaml = dump({
      transition: operation
    })

    await expect(step.call(context, label, yaml)).resolves.not.toThrow()
  })
})

describe('Then normalized operation {operation} declaration must contain:', () => {
  const step = gherkin.steps.Th('normalized operation {operation} declaration must contain:')

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
