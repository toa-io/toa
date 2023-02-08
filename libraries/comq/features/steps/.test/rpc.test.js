'use strict'

const { resolve, join } = require('node:path')
const { AssertionError } = require('node:assert')
const { generate } = require('randomstring')
const { dump } = require('@toa.io/libraries/yaml')
const { gherkin } = require('@toa.io/libraries/mock')
const { io } = require('./io.mock')
const mock = { gherkin }

jest.mock('@cucumber/cucumber', () => mock.gherkin)

require('../rpc')

/** @type {toa.comq.features.Context} */
let context

const queue = generate()

beforeEach(() => {
  jest.clearAllMocks()

  context = { io }
})

describe('Given producer {token} is replying {token} queue', () => {
  const step = gherkin.steps.Gi('producer {token} is replying {token} queue')

  it('should be', () => undefined)

  const root = resolve(__dirname, '../producers')

  it.each(['add'])('should set `add` as producer', async (name) => {
    const path = join(root, name)
    const producer = require(path)[name]

    expect(producer).toBeInstanceOf(Function)

    await step.call(context, name, queue)

    expect(io.reply).toHaveBeenCalledWith(queue, producer)
  })
})

describe('When I send following request to {token} queue:', () => {
  const step = gherkin.steps.Wh('I send following request to {token} queue:')

  it('should be', async () => undefined)

  const payload = { [generate()]: generate() }

  beforeEach(async () => {
    const yaml = dump(payload)

    await step.call(context, queue, yaml)
  })

  it('should send request', async () => {
    expect(io.request).toHaveBeenCalledWith(queue, payload)
  })

  it('should store reply', async () => {
    const reply = await io.request.mock.results[0].value

    expect(context.reply).toStrictEqual(reply)
  })
})

describe('Then I get the reply:', (type, value) => {
  const step = gherkin.steps.Th('I get the reply:')

  it('should be', async () => undefined)

  const replies = [
    ['primitive', generate()],
    ['object', { ok: 1 }],
    ['array', [1, 'foo']]
  ]

  describe.each(replies)('%s reply comparison', (type, value) => {
    let yaml

    beforeEach(() => {
      yaml = dump(value)
    })

    it('should throw if differ', async () => {
      context.reply = generate()

      expect(() => step.call(context, yaml)).toThrow(AssertionError)
    })

    it('should pass if equals', async () => {
      context.reply = value

      expect(() => step.call(context, yaml)).not.toThrow()
    })
  })
})
