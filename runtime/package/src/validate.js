'use strict'

const path = require('path')
const { yaml } = require('@kookaburra/gears')
const { Schema } = require('@kookaburra/schema')

const object = yaml.sync(path.resolve(__dirname, 'schema.yaml'))
const schema = new Schema(object)

const validate = (manifest) => {
  const error = schema.fit(manifest)

  if (error) throw new Error(error.message)

  if (manifest.receivers) {
    for (const [locator, receiver] of Object.entries(manifest.receivers)) {
      if (manifest.operations?.[receiver.transition] === undefined) { throw new Error(`Receiver '${locator}' refers to undefined transition '${receiver.transition}'`) }

      if (manifest.operations[receiver.transition].type !== 'transition') { throw new Error(`Receiver '${locator}' refers to non-transition '${receiver.transition}'`) }

      const [domain, name] = locator.split('.')
      const fqn = domain + '.' + name

      if (manifest.remotes === undefined) manifest.remotes = []
      if (manifest.remotes.indexOf(fqn) === -1) manifest.remotes.push(fqn)
    }
  }
}

exports.validate = validate
