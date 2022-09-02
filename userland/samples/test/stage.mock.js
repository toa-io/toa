'use strict'

const { generate } = require('randomstring')
const { Locator } = require('@toa.io/core')

const locator = () => {
  const name = generate()
  const namespace = generate()

  return new Locator(name, namespace)
}

// stage
const manifest = jest.fn(async () => ({ locator: locator() }))
const composition = jest.fn()
const shutdown = jest.fn()

// noinspection JSCheckFunctionSignatures
const invoke = jest.fn(async (operation, request) => request.reply)

// noinspection JSCheckFunctionSignatures
const remote = jest.fn(async (id) => {
  const [namespace, name] = id.split('.')
  const locator = new Locator(name, namespace)

  return { locator, invoke }
})

const stage = { manifest, composition, remote, shutdown }

exports.invoke = invoke
exports.stage = stage
