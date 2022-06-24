'use strict'

const fixtures = require('./context.fixtures')
const { Factory } = require('../')

const factory = new Factory()

let context

beforeEach(() => {
  context = factory.context(fixtures.schema)
})

it('should return schema defaults', () => {
  const foo = context.invoke(['foo'])

  expect(foo).toStrictEqual(fixtures.schema.properties.foo.default)
})

it('should return nested values', () => {
  const baz = context.invoke(['bar', 'baz'])

  expect(baz).toStrictEqual(fixtures.schema.properties.bar.properties.baz.default)
})

it('should expose configuration tree', () => {
  const configuration = context.invoke()

  expect(configuration).toStrictEqual({
    foo: fixtures.schema.properties.foo.default,
    bar: {
      baz: fixtures.schema.properties.bar.properties.baz.default
    },
    quu: null
  })
})
