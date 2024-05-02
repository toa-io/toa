'use strict'

/** @type {toa.node.shortcut} */
function configuration (context, aspect) {
  Object.defineProperty(context, 'configuration', {
    get: () => aspect.invoke()
  })
}

exports.configuration = configuration
