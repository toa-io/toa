'use strict'

const { resolve } = require('node:path')
const { Connector } = require('@toa.io/core')

const { Factory } = require('../src/factory')
const { calls } = require('./dummies/rc/rc/phases')

const root = resolve(__dirname, 'dummies/rc')

let factory
let context

beforeEach(() => {
  factory = new Factory()
  context = new Connector()
  context.aspects = []
  calls.length = 0
})

it('should create a connector per exported phase', async () => {
  const phases = await factory.rc(root, context)

  expect(phases.preflight).toBeDefined()
  expect(phases.settle).toBeDefined()
  expect(phases.dispose).toBeDefined()
})

it('should run startup phases on connection', async () => {
  const phases = await factory.rc(root, context)

  await phases.preflight.connect()
  await phases.settle.connect()

  expect(calls).toStrictEqual(['preflight', 'settle'])
})

it('should not run disposal on connection', async () => {
  const phases = await factory.rc(root, context)

  await phases.dispose.connect()

  expect(calls).toStrictEqual([])
})

it('should run disposal on disconnection', async () => {
  const phases = await factory.rc(root, context)

  await phases.dispose.connect()
  await phases.dispose.disconnect()

  expect(calls).toStrictEqual(['dispose'])
})

it('should reject an RC exporting no phase', async () => {
  const promise = factory.rc(resolve(__dirname, 'dummies/rc.none'), context)

  await expect(promise).rejects
    .toThrow("RC 'empty' must export preflight, settle and/or dispose")
})
