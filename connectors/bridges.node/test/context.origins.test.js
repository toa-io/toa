'use strict'

const { generate } = require('randomstring')

const fixtures = require('./context.origins.fixtures')
const { Context } = require('../src/context')

const origins = fixtures.context.aspects[0]

let context

beforeEach(async () => {
  jest.clearAllMocks()

  context = new Context(fixtures.context)

  await context.connect()
})

it('should expose aspect', async () => {
  expect(context.aspects.http).toBeDefined()
})

it('should invoke', async () => {
  const name = generate()
  const arg = { [generate()]: generate() }

  await context.http[name].baz.quu.get(arg)

  expect(origins.invoke).toHaveBeenCalled()
  expect(origins.invoke).toHaveBeenCalledWith(name, 'baz/quu', expect.objectContaining(arg), undefined)
})

it('should define request method', async () => {
  const arg = { [generate()]: generate() }

  await context.http.foo.post(arg)
  await context.http.bar.baz.put()

  expect(origins.invoke).toHaveBeenNthCalledWith(1, 'foo', '', { method: 'POST', ...arg }, undefined)
  expect(origins.invoke).toHaveBeenNthCalledWith(2, 'bar', 'baz', { method: 'PUT' }, undefined)
})

it('should throw if no origin name specified', async () => {
  await expect(context.http.get()).rejects.toThrow(/at least 2 arguments/)
})

it('should pass options', async () => {
  const options = { [generate()]: generate() }
  await context.http.foo.post({}, options)

  expect(origins.invoke.mock.calls[0][3]).toStrictEqual(options)
})
