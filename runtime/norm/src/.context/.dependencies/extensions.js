import { Locator } from '@toa.io/core'
import { converge } from '../converge.js'
import { component as load } from '../../component.js'
import { definition } from '../../definition.js'

export const extensions = async (context) => {
  const extensions = {}
  const components = context.components?.slice() ?? []

  /** the components each extension brings, by reference
   *  @type {Map<string, toa.norm.Component[]>} */
  const contributed = new Map()

  // an extension a composition runs may be referenced by no component of this context,
  // and its own components must be extracted all the same
  const declared = await extractDeclaredServices(context, extensions, contributed)

  // and so may one deployed for its annotation alone
  const { references: annotated, extracted: standing } = await extractAnnotatedServices(
    context,
    extensions,
    contributed
  )

  const listed = declared.concat(standing)

  const extracted = listed.concat(
    await extractExtensionComponents(
      components.concat(listed),
      extensions,
      contributed,
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

  return { extensions, components: extracted, contributed, annotated }
}

async function extractDeclaredServices(context, extensions, contributed) {
  const extracted = []

  for (const composition of context.compositions ?? [])
    for (const reference of composition.services ?? []) {
      if (reference in extensions) continue

      try {
        extracted.push(
          ...(await extract(reference, extensions, contributed, context.annotations))
        )
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

/**
 * The components of the extensions a context annotates that deploy for their annotation, which
 * no component of the context need reference: what such an extension ships is the context's as
 * much as what a composition runs is.
 */
async function extractAnnotatedServices(context, extensions, contributed) {
  const references = []
  const extracted = []

  for (const reference of Object.keys(context.annotations ?? {})) {
    if (reference in extensions) continue

    const module = await optional(reference)

    if (module?.standalone !== true) continue

    references.push(reference)
    extracted.push(
      ...(await extract(reference, extensions, contributed, context.annotations))
    )
  }

  return { references, extracted }
}

/** What a reference defines, or nothing where it names no package. */
async function optional(reference) {
  try {
    return (await definition(reference)).module
  } catch {
    return null
  }
}

async function extractExtensionComponents(
  components,
  extensions,
  contributed,
  annotations
) {
  const extracted = []

  for (const component of components) {
    if (component.extensions === undefined) continue

    for (const reference of Object.keys(component.extensions)) {
      if (reference in extensions) continue

      extracted.push(...(await extract(reference, extensions, contributed, annotations)))
    }
  }

  if (extracted.length === 0) return extracted

  const deeper = await extractExtensionComponents(
    extracted,
    extensions,
    contributed,
    annotations
  )

  return extracted.concat(deeper)
}

/**
 * The components an extension contributes, if it contributes any.
 *
 * @param {string} reference
 * @param {object} extensions
 * @param {Map<string, toa.norm.Component[]>} contributed
 * @param {object} [annotations]
 * @returns {Promise<Array<toa.norm.Component>>}
 */
async function extract(reference, extensions, contributed, annotations) {
  extensions[reference] = []

  const { name, module: mod } = await definition(reference)

  if (mod.components === undefined) return []

  // the annotation decides whether an extension contributes components at all
  const annotation = annotations?.[name]
  const { manifests, paths } = mod.components(annotation)

  // a definition carries the manifests, read where the extension is not installed;
  // an entry names the directories, where it is
  const extracted = manifests === undefined ? [] : manifests.map(revive)

  if (manifests === undefined) for (const path of paths) extracted.push(await load(path))

  contributed.set(reference, extracted)

  return extracted
}

/** A manifest as a digest carries it, which is one norm read, without the locator. */
function revive(manifest) {
  manifest.locator = new Locator(manifest.name, manifest.namespace)

  return manifest
}
