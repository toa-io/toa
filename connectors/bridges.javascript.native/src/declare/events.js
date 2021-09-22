'use strict'

const load = require('../load')

const event = async (root, label) => {
  const module = await load.event(root, label)
  return declaration(module)
}

const events = async (root) => {
  const modules = await load.events(root)

  return modules.map(declaration)
}

const declaration = (module) => {
  const declaration = { label: module.basename }

  declaration.conditional = module.exports.condition !== undefined
  declaration.subjective = module.exports.payload !== undefined

  return declaration
}

exports.event = event
exports.events = events
