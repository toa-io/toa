'use strict'

const { generate } = require('randomstring')
const { Locator } = require('@toa.io/core')

const { Pointer } = require('../src/pointer')

it('should be', () => undefined)

/** @type {toa.core.Locator} */
let locator

/** @type {toa..Pointer} */
let pointer

beforeEach(() => {
  const name = generate()
  const namespace = generate()

  locator = new Locator(name, namespace)
  pointer = new Pointer(locator)
})

it('should define schema', () => {
  expect(pointer.protocol).toStrictEqual('mongodb:')
})

it('should expose db', () => {
  expect(pointer.db).toStrictEqual(locator.namespace)
})

it('should expose collection', () => {
  expect(pointer.collection).toStrictEqual(locator.name)
})
