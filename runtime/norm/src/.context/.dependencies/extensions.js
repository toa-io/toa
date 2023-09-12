'use strict'

const extensions = async (context) => {
  const extensions = {}
  const components = context.components?.slice() ?? []

  components.push(...(await extractExtensionComponents(components, extensions)))

  for (const component of components) {
    if (component.extensions === undefined) continue

    for (const reference of Object.keys(component.extensions)) {
      if (extensions[reference] === undefined) extensions[reference] = []

      extensions[reference].push(component)
    }
  }

  return extensions
}

async function extractExtensionComponents (components, extensions) {
  const { component: load } = require('../../component')

  const extracted = []

  for (const component of components) {
    if (component.extensions === undefined) continue

    for (const reference of Object.keys(component.extensions)) {
      if (reference in extensions) continue

      extensions[reference] = []

      const mod = require(reference)

      if (mod.components === undefined) continue

      for (const path of mod.components().paths) {
        const component = await load(path)

        extracted.push(component)
      }
    }
  }

  if (extracted.length === 0)
    return extracted

  const deeper = await extractExtensionComponents(extracted, extensions)

  return extracted.concat(deeper)
}

exports.extensions = extensions
