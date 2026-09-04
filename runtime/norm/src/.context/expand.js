import * as shortcuts from '../shortcuts.js'

/**
 * @param {toa.norm.context.Declaration | object} context
 */
export const expand = (context) => {
  shortcuts.recognize(shortcuts.SHORTCUTS, context, 'annotations')
  shortcuts.recognize(shortcuts.SHORTCUTS, context.annotations)

  // a composition names a service the way a manifest names an extension, and everything
  // downstream matches it against a dependency, which is keyed by package reference
  for (const composition of context.compositions ?? [])
    if (composition.services !== undefined)
      composition.services = composition.services.map(shortcuts.resolve)
}
