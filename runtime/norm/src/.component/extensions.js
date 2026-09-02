import { find } from '@toa.io/generic'
import { resolve } from '../shortcuts.js'

const cache = {}

const extensions = async (manifest) => {
  manifest.extensions = Object.assign({}, PREDEFINED, manifest.extensions)

  const extensions = manifest.extensions

  for (let [reference, declaration] of Object.entries(extensions)) {
    let key = resolve(reference)

    // relative path
    if (key[0] === '.') key = find(key, manifest.path)

    cache[key] ??= import(key)

    const extension = await cache[key]

    if (extension.manifest !== undefined) {
      declaration = extension.manifest(declaration, manifest)

      if (declaration === undefined) throw new Error(`Extension '${reference}' hasn't returned manifest`)
    }

    extensions[key] = declaration

    // shortcut was used
    if (reference !== key) delete extensions[reference]
  }
}

const PREDEFINED = {
  '@toa.io/extensions.telemetry': null,
  '@toa.io/extensions.fetch': null,
  '@toa.io/extensions.introspection': null
}

export { extensions }
