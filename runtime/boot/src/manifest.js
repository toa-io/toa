import clone from 'clone-deep'
import { basename } from 'node:path'
import { merge } from '@toa.io/generic'
import { component as load } from '@toa.io/norm'
import { Locator } from '@toa.io/core'

import { span } from './span.js'

export const manifest = async (path, options = {}) => {
  options = merge(clone(options), DEFAULTS)

  const manifest = await span({ name: `manifest ${basename(path)}`, attributes: { path } },
    async () => await load(path))

  if (options?.bindings !== undefined) {
    if ('operations' in manifest) {
      for (const operation of Object.values(manifest.operations)) {
        operation.bindings = options.bindings
      }
    }

    let asyncBinding

    for (const binding of options.bindings) {
      const { properties } = await import(binding)

      if (properties?.async === true) {
        asyncBinding = binding
        break
      }
    }

    if (asyncBinding === undefined) throw new Error('Bindings override must contain at least one async binding')

    if ('events' in manifest) {
      for (const event of Object.values(manifest.events)) event.binding = asyncBinding
    }

    if ('receivers' in manifest) {
      for (const receiver of Object.values(manifest.receivers)) {
        if (receiver.source === undefined) receiver.binding = asyncBinding
      }
    }
  }

  if (manifest.extensions === undefined) manifest.extensions = {}

  if (options.extensions !== undefined) {
    for (const extension of options.extensions) {
      if (!(extension in manifest.extensions)) manifest.extensions[extension] = null
    }
  }

  if ('storage' in options && 'entity' in manifest) manifest.entity.storage = options.storage

  manifest.locator = new Locator(manifest.name, manifest.namespace)

  return manifest
}

const DEFAULTS = {}
