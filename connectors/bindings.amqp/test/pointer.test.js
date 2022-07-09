'use strict'

const { generate } = require('randomstring')
const { Locator } = require('@toa.io/core')

const { Pointer } = require('../src/pointer')
const { PREFIX } = require('../src/constants')

/** @type {toa.core.Locator} */
let locator

/** @type {toa.amqp.Pointer} */
let pointer

let hostname

const protocol = 'amqp:'

beforeEach(() => {
  const name = generate()
  const namespace = generate()

  locator = new Locator(name, namespace)
  pointer = new Pointer(locator)

  hostname = locator.hostname(PREFIX)
})

it('should be', () => undefined)

it('should expose hostname', () => {
  expect(pointer.hostname).toStrictEqual(hostname)
})

it('should expose vhost', () => {
  expect(pointer.path).toStrictEqual('/')
})

it('should expose protocol', () => {
  expect(pointer.protocol).toStrictEqual(protocol)
})

it('should expose reference', () => {
  expect(pointer.reference).toStrictEqual(`${protocol}//${hostname}/`)
})
