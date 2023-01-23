'use strict'

const { component } = require('./component')

/**
 * @param {toa.samples.features.Context} context
 * @returns {toa.samples.Suite}
 */
const translate = (context) => {
  return {
    autonomous: true,
    components: {
      [context.component]: component(context)
    }
  }
}

exports.translate = translate
