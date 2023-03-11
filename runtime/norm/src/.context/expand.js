'use strict'

const { recognize } = require('../shortcuts')

/**
 * @param {toa.norm.context.Declaration | object} context
 */
const expand = (context) => {
  recognize(context, 'annotations')
  recognize(context.annotations)

}

exports.expand = expand
