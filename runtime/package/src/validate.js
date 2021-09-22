'use strict'

const path = require('path')
const { yaml } = require('@kookaburra/gears')
const { Schema } = require('@kookaburra/schema')

const object = yaml.sync(path.resolve(__dirname, 'schema.yaml'))
const schema = new Schema(object)

const validate = (manifest) => {
  const error = schema.fit(manifest)

  if (error) throw new Error(error.message)

  // duplicate events
  if (manifest.events) {
    for (const event of manifest.events) {
      const dupe = manifest.events.find((candidate) => candidate !== event && candidate.label === event.label)

      if (dupe) throw new Error(`Duplicate event declaration '${event.label}'`)
    }
  }
}

exports.validate = validate
