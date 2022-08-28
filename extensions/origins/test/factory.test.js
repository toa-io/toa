'use strict'

const { generate } = require('randomstring')

const { Annex } = require('../src/annex')
const { Locator } = require('@toa.io/core')

const fixtures = require('./factory.fixtures')
const { Factory } = require('../src')

/** @type {toa.core.extensions.Factory} */
let factory

beforeEach(() => {
  factory = new Factory()
})

it('should create context extension', () => {
  const extension = factory.annex(new Locator(generate(), generate()), fixtures.declaration)

  expect(extension).toBeInstanceOf(Annex)
})
