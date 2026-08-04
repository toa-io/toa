'use strict'

const { console } = require('openspan')
const { Connector } = require('../src/connector')
const { Discovery } = require('../src/discovery')

class Lookup extends Connector {
  invoke = jest.fn(async () => ({ operations: {} }))
}

/** @type {Lookup} */
let lookup

/** @type {Discovery} */
let discovery

/** @type {jest.SpyInstance} */
let warn

const locator = { id: 'dummies.one' }

beforeEach(async () => {
  jest.useFakeTimers()

  warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
  lookup = new Lookup()
  discovery = new Discovery(async () => lookup)

  await discovery.connect()
})

afterEach(() => {
  warn.mockRestore()
  jest.useRealTimers()
})

it('should not warn if a lookup is answered', async () => {
  await discovery.lookup(locator)

  jest.advanceTimersByTime(60_000)

  expect(warn).not.toHaveBeenCalled()
})

it('should keep warning while a lookup is unanswered', async () => {
  lookup.invoke.mockImplementation(() => new Promise(() => undefined))

  void discovery.lookup(locator)

  await jest.advanceTimersByTimeAsync(12_000)

  expect(warn).toHaveBeenCalledTimes(2)

  expect(warn).toHaveBeenLastCalledWith('Waiting for lookup response',
    { component: locator.id, waiting: 10 })
})
