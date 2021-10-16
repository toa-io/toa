'use strict'

const { lookup } = require('@toa.io/gears')

const normalize = (manifest) => {
  if (manifest.operations !== undefined) operations(manifest)
  if (manifest.events !== undefined) events(manifest)
  if (manifest.extensions !== undefined) extensions(manifest)
}

const operations = (manifest) => {
  for (const operation of Object.values(manifest.operations)) {
    if (operation.bindings === undefined) operation.bindings = manifest.bindings
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
    const path = lookup(key, manifest.path)
    const extension = require(path)

    if (extension.manifest?.normalize) manifest.extensions[key] = extension.manifest.normalize(value, manifest)
  }
}

exports.normalize = normalize
