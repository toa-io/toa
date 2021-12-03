'use strict'

const path = require('node:path')

const { yaml } = require('@toa.io/gears')
const { Schema } = require('@toa.io/schema')

const object = yaml.sync(path.resolve(__dirname, 'schema.yaml'))
const schema = new Schema(object)

const validate = (manifest) => {
  const error = schema.fit(manifest)

  if (error) throw new Error(error.message)

  if (manifest.events !== undefined) events(manifest)
  if (manifest.receivers !== undefined) receivers(manifest)
  if (manifest.extensions !== undefined) extensions(manifest)
}

const events = (manifest) => {
  for (const [label, event] of Object.entries(manifest.events)) {
    if (require(event.binding).properties.async !== true) {
      throw new Error(`Event '${label}' binding '${event.binding}' is not async`)
    }
  }
}

const receivers = (manifest) => {
  for (const [locator, receiver] of Object.entries(manifest.receivers)) {
    if (manifest.operations?.[receiver.transition] === undefined) {
      throw new Error(`Receiver '${locator}' refers to undefined transition '${receiver.transition}'`)
    }

    if (manifest.operations[receiver.transition].type !== 'transition') {
      throw new Error(`Receiver '${locator}' refers to non-transition '${receiver.transition}'`)
    }
  }
}

const extensions = (manifest) => {
  for (const [key, value] of Object.entries(manifest.extensions)) {
    const extension = require(key)

    if (extension.manifest?.validate !== undefined) extension.manifest.validate(value)
  }
}

exports.validate = validate
