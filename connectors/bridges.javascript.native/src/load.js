'use strict'

const { basename, resolve } = require('path')
const glob = require('fast-glob')

const constants = require('./constants')

const operation = (root, name) => load(root, constants.OPERATIONS_DIRECTORY, name)
const event = (root, name) => load(root, constants.EVENTS_DIRECTORY, name)

const events = async (root) => {
  const pattern = resolve(root, constants.EVENTS_DIRECTORY, '*' + constants.EXTENSION)
  const modules = await glob(pattern)

  return modules.map((module) => ({ exports: require(module), basename: basename(module, constants.EXTENSION) }))
}

const load = (root, directory, name) => require(resolve(root, directory, name + constants.EXTENSION))

exports.operation = operation
exports.event = event
exports.events = events
