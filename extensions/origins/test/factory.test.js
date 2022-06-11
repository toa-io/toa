'use strict'

const { Context } = require('../src/context')

const fixtures = require('./factory.fixtures')
const { Factory } = require('../src')

/** @type {toa.core.extensions.Factory} */
let factory

beforeEach(() => {
  factory = new Factory()
})

it('should create context extension', () => {
  const extensions = factory.contexts(fixtures.declaration)

  expect(extensions.length).toStrictEqual(1)

  const extension = extensions[0]

  expect(extension).toBeInstanceOf(Context)
})
