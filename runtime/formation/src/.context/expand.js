'use strict'

const { recognize } = require('../lookup')

/**
 * @param {toa.formation.context.Declaration | object} context
 */
const expand = (context) => {
  recognize(context, 'annotations')
  recognize(context.annotations)

}

exports.expand = expand
