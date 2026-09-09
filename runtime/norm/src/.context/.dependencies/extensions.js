import { Locator } from '@toa.io/core'
import { converge } from '../converge.js'
import { component as load } from '../../component.js'
import { definition } from '../../definition.js'

export const extensions = async (context) => {
  const extensions = {}
  const components = context.components?.slice() ?? []

  // an extension a composition runs may be referenced by no component of this context,
  // and its own components must be extracted all the same
  const declared = await extractDeclaredServices(context, extensions)

  const extracted = declared.concat(
    await extractExtensionComponents(
      components.concat(declared),
      extensions,
      context.annotations
    )
  )

  components.push(...extracted)

  // after the extraction, because what an extension ships converges like anything else
  converge(context, components)

  for (const component of components) {
    if (component.extensions === undefined) continue

    for (const reference of Object.keys(component.extensions)) {
      if (extensions[reference] === undefined) extensions[reference] = []

      extensions[reference].push(component)
    }
  }

  return { extensions, components: extracted }
}

async function extractDeclaredServices(context, extensions) {
  const extracted = []

  for (const composition of context.compositions ?? [])
    for (const reference of composition.services ?? []) {
      if (reference in extensions) continue

      try {
        extracted.push(...(await extract(reference, extensions, context.annotations)))
      } catch (e) {
        throw new Error(
          `Composition '${composition.name}' lists '${reference}', ` +
            `which cannot be resolved: ${e.message}`,
          { cause: e }
        )
      }
    }

  return extracted
}

async function extractExtensionComponents(components, extensions, annotations) {
  const extracted = []

  for (const component of components) {
    if (component.extensions === undefined) continue

    for (const reference of Object.keys(component.extensions)) {
      if (reference in extensions) continue

      extracted.push(...(await extract(reference, extensions, annotations)))
    }
  }

  if (extracted.length === 0) return extracted

  const deeper = await extractExtensionComponents(extracted, extensions, annotations)

  return extracted.concat(deeper)
}

/**
 * The components an extension contributes, if it contributes any.
 *
 * @param {string} reference
 * @param {object} extensions
 * @param {object} [annotations]
 * @returns {Promise<Array<toa.norm.Component>>}
 */
async function extract(reference, extensions, annotations) {
  extensions[reference] = []

  const { name, module: mod } = await definition(reference)

  if (mod.components === undefined) return []

  // the annotation decides whether an extension contributes components at all
  const annotation = annotations?.[name]
  const { manifests, paths } = mod.components(annotation)

  // a definition carries the manifests, read where the extension is not installed;
  // an entry names the directories, where it is
  if (manifests !== undefined) return manifests.map(revive)

  const extracted = []

  for (const path of paths) extracted.push(await load(path))

  return extracted
}

/** A manifest as a digest carries it, which is one norm read, without the locator. */
function revive(manifest) {
  manifest.locator = new Locator(manifest.name, manifest.namespace)

  return manifest
}
