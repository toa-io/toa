'use strict'

const path = require('path')
const { yaml } = require('@kookaburra/gears')
const { Schema } = require('@kookaburra/schema')

const object = yaml.sync(path.resolve(__dirname, 'schema.yaml'))
const schema = new Schema(object)

const validate = (manifest) => {
  const error = schema.fit(manifest)

  if (error) throw new Error(error.message)

  if (manifest.events) events(manifest)
  if (manifest.receivers) receivers(manifest)
}

const events = (manifest) => {
  const binding = manifest.bindings.find((binding) => require(binding).properties.async === true)

  for (const [label, event] of Object.entries(manifest.events)) {
    if (event.binding === undefined) event.binding = binding
    else if (require(event.binding).properties.async !== true) {
      throw new Error(`Event '${label}' binding '${event.binding}' is not async`)
    }

    if (event.binding === undefined) throw Error(`No binding for event '${label}'`)
  }
}

const receivers = (manifest) => {
  for (const [locator, receiver] of Object.entries(manifest.receivers)) {
    if (manifest.operations?.[receiver.transition] === undefined) { throw new Error(`Receiver '${locator}' refers to undefined transition '${receiver.transition}'`) }

    if (manifest.operations[receiver.transition].type !== 'transition') { throw new Error(`Receiver '${locator}' refers to non-transition '${receiver.transition}'`) }

    const [domain, name] = locator.split('.')
    const fqn = domain + '.' + name

    if (manifest.remotes === undefined) manifest.remotes = []
    if (manifest.remotes.indexOf(fqn) === -1) manifest.remotes.push(fqn)
  }
}

exports.validate = validate
