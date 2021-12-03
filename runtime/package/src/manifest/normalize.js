'use strict'

const normalize = (manifest) => {
  if (manifest.operations !== undefined) operations(manifest)
  if (manifest.events !== undefined) events(manifest)
  if (manifest.extensions !== undefined) extensions(manifest)
}

const operations = (manifest) => {
  for (const [endpoint, operation] of Object.entries(manifest.operations)) {
    if (operation.bindings === undefined) operation.bindings = manifest.bindings
    if (operation.virtual === true) delete manifest.operations[endpoint]
  }
}

const events = (manifest) => {
  const binding = manifest.bindings.find((binding) => require(binding).properties.async === true)

  for (const event of Object.values(manifest.events)) {
    if (event.binding === undefined) event.binding = binding
  }
}

const extensions = (manifest) => {
  for (const [key, value] of Object.entries(manifest.extensions)) {
    const extension = require(key)

    if (extension.manifest?.normalize) manifest.extensions[key] = extension.manifest.normalize(value, manifest)
  }
}

exports.normalize = normalize
