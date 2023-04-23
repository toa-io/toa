'use strict'

const clone = require('clone-deep')
const { generate } = require('randomstring')
const { Locator } = require('@toa.io/core')
const { sample, overwrite } = require('@toa.io/generic')

jest.mock('./aspects/http')

const { create } = require('./aspects/http')

const fixtures = require('./.test/factory.fixtures')
const { Factory } = require('../')

let factory

beforeEach(() => {
  jest.clearAllMocks()

  factory = new Factory()
})

it('should create aspect', () => {
  factory.aspect(new Locator(generate(), generate()), fixtures.declaration)

  expect(create).toHaveBeenCalledWith(fixtures.declaration)
})

it('should overwrites URLs from environment', async () => {
  const declaration = clone(fixtures.declaration)
  const key = sample(Object.keys(declaration))
  const override = { [key]: 'http://' + generate() }
  const json = JSON.stringify(override)
  const base64 = btoa(json)
  const locator = new Locator(generate(), generate())

  process.env['TOA_ORIGINS_' + locator.uppercase] = base64

  factory.aspect(locator, fixtures.declaration)

  const expected = overwrite(declaration, override)

  expect(create).toHaveBeenCalledWith(expected)
})