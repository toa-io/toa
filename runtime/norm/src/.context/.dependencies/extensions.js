'use strict'

const extensions = async (context) => {
  const extensions = {}
  const components = context.components?.slice() ?? []
  const extracted = await extractExtensionComponents(components, extensions, context.annotations)

  components.push(...extracted)

  for (const component of components) {
    if (component.extensions === undefined) continue

    for (const reference of Object.keys(component.extensions)) {
      if (extensions[reference] === undefined) extensions[reference] = []

      extensions[reference].push(component)
    }
  }

  return { extensions, components: extracted }
}

async function extractExtensionComponents (components, extensions, annotations) {
  const { component: load } = require('../../component')
  const { load: loadDependency } = require('./load')

  const extracted = []

  for (const component of components) {
    if (component.extensions === undefined) continue

    for (const reference of Object.keys(component.extensions)) {
      if (reference in extensions) continue

      extensions[reference] = []

      const { metadata, module: mod } = loadDependency(reference)

      if (mod.components === undefined) continue

      // the annotation decides whether an extension contributes components at all
      const annotation = annotations?.[metadata?.name ?? reference]

      for (const path of mod.components(annotation).paths) {
        const component = await load(path)

        extracted.push(component)
      }
    }
  }

  if (extracted.length === 0)
    return extracted

  const deeper = await extractExtensionComponents(extracted, extensions, annotations)

  return extracted.concat(deeper)
}

exports.extensions = extensions
