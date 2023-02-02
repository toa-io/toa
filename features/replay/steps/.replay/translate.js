'use strict'

const { operations, messages } = require('./.translate')

/**
 * @param {toa.samples.features.Context} context
 * @returns {toa.samples.Suite}
 */
const translate = (context) => {
  /** @type {toa.samples.Suite} */
  const suite = { autonomous: context.autonomous }

  if ('operation' in context) suite.operations = operations(context)
  if ('message' in context) suite.messages = messages(context)

  return suite
}

exports.translate = translate
