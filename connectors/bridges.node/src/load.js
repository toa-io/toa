'use strict'

const { basename, resolve } = require('path')
const { file: { glob } } = require('@toa.io/libraries/filesystem')

const operation = (root, name) => load(root, OPERATIONS_DIRECTORY, name)
const event = (root, name) => load(root, EVENTS_DIRECTORY, name)
const receiver = (root, name) => load(root, RECEIVERS_DIRECTORY, name)

const scan = (directory) => async (root) => {
  const pattern = resolve(root, directory, '*' + EXTENSION)
  const modules = await glob(pattern)

  return modules.map((module) => [basename(module, EXTENSION), require(module)])
}

const load = (root, directory, name) => require(resolve(root, directory, name + EXTENSION))

const EXTENSION = '.js'
const EVENTS_DIRECTORY = 'events'
const RECEIVERS_DIRECTORY = 'receivers'
const OPERATIONS_DIRECTORY = 'operations'

exports.operation = operation
exports.event = event
exports.receiver = receiver
exports.operations = scan(OPERATIONS_DIRECTORY)
exports.events = scan(EVENTS_DIRECTORY)
exports.receivers = scan(RECEIVERS_DIRECTORY)
