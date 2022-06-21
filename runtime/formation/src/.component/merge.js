'use strict'

const { merge } = require('@toa.io/libraries.generic')

const bridge = async (root, manifest) => {
  await Promise.all([
    define(root, manifest, 'operations'),
    define(root, manifest, 'events'),
    define(root, manifest, 'receivers')
  ])
}

const define = async (root, manifest, property) => {
  const singular = property.replace(/(s)$/, '')

  // non default bridges
  if (manifest[property]) {
    for (const [endpoint, item] of Object.entries(manifest[property])) {
      if (item.bridge === undefined || item.bridge === manifest.bridge) continue // default bridge later

      const bridge = item.bridge || manifest.bridge
      const { define } = require(bridge)
      const definition = await define[singular](root, endpoint)

      merge(item, definition)
    }
  }

  // default bridge
  const definition = await scan(manifest.bridge, root, property)
  const items = Object.entries(definition)

  if (items.length) {
    if (manifest[property] === undefined) manifest[property] = {}

    for (const [endpoint, item] of items) {
      if (property !== 'operations') item.path = root

      item.bridge = manifest.bridge

      const declared = manifest[property][endpoint]

      if (declared === undefined) manifest[property][endpoint] = item
      else merge(declared, item)
    }
  }
}

const scan = async (bridge, root, property) => {
  const { define } = require(bridge)

  return define[property](root)
}

exports.merge = bridge
