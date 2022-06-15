'use strict'

const { generate } = require('randomstring')

const fixtures = require('./context.fixtures')
const { Context } = require('../src/context')

const origins = fixtures.context.extensions[0]

let context

beforeEach(() => {
  jest.clearAllMocks()

  context = new Context(/** @type {toa.core.Context} */ fixtures.context)
})

describe('extensions.origins', () => {
  it('should invoke', async () => {
    const name = generate()
    const arg = { [generate()]: generate() }

    await context.origins[name].baz.quu.get(arg)

    expect(origins.invoke).toHaveBeenCalled()
    expect(origins.invoke).toHaveBeenCalledWith(name, 'baz/quu', expect.objectContaining(arg))
  })

  it('should define request method', async () => {
    const arg = { [generate()]: generate() }

    await context.origins.foo.post(arg)
    await context.origins.bar.baz.put()

    expect(origins.invoke).toHaveBeenNthCalledWith(1, 'foo', '', { method: 'POST', ...arg })
    expect(origins.invoke).toHaveBeenNthCalledWith(2, 'bar', 'baz', { method: 'PUT' })
  })

  it('should throw if no origin name specified', async () => {
    await expect(context.origins.get()).rejects.toThrow(/at least 2 arguments/)
  })
})
