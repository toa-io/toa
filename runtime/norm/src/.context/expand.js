'use strict'

const shortcuts = require('../shortcuts')

/**
 * @param {toa.norm.context.Declaration | object} context
 */
const expand = (context) => {
  shortcuts.recognize(shortcuts.SHORTCUTS, context, 'annotations')
  shortcuts.recognize(shortcuts.SHORTCUTS, context.annotations)
}

exports.expand = expand
