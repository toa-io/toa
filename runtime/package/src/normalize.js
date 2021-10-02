'use strict'

const normalize = (manifest) => {
  if (manifest.operations) operations(manifest)
  if (manifest.events) events(manifest)
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

exports.normalize = normalize
