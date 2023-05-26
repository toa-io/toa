// noinspection JSCheckFunctionSignatures

'use strict'

const { Locator } = require('@toa.io/core')
const stage = jest.requireActual('@toa.io/userland/stage')

const manifest = jest.fn(async (path) => stage.manifest(path))
const composition = jest.fn()
const shutdown = jest.fn()

const remote = jest.fn(async (id) => {
  const [namespace, name] = id.split('.')
  const locator = new Locator(name, namespace)
  const invoke = jest.fn(async (endpoint, request) => request.reply)
  const disconnect = jest.fn(async () => undefined)

  return { locator, invoke, disconnect }
})

const component = jest.fn(async () => {
  const invoke = jest.fn(async (endpoint, request) => request.reply)

  return { invoke }
})

const emit = jest.fn()
const binding = { binding: { emit } }

exports.stage = { manifest, composition, component, remote, shutdown, binding }
