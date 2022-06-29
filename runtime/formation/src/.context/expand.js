'use strict'

const { recognize } = require('../shortcuts')

/**
 * @param {toa.formation.context.Declaration | object} context
 */
const expand = (context) => {
  recognize(context, 'annotations')
  recognize(context.annotations)

}

exports.expand = expand
