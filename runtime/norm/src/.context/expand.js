import * as shortcuts from '../shortcuts.js'

/**
 * @param {toa.norm.context.Declaration | object} context
 */
export const expand = (context) => {
  shortcuts.recognize(shortcuts.SHORTCUTS, context, 'annotations')
  shortcuts.recognize(shortcuts.SHORTCUTS, context.annotations)
}
