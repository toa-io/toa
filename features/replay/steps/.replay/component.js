'use strict'

/**
 * @param {toa.samples.features.Context} context
 * @returns {toa.samples.Component}
 */
const component = (context) => {
  /** @type {toa.samples.Component} */
  const component = {}

  if ('operation' in context) component.operations = operations(context.operation)
  if ('message' in context) component.messages = messages(context.message)

  return component
}

/**
 * @param {toa.samples.features.Operation} operation
 * @returns {toa.samples.operations.Set}
 */
const operations = (operation) => ({ [operation.endpoint]: operation.samples })

/**
 * @param {toa.samples.features.Message} message
 * @returns {toa.samples.messages.Set}
 */
const messages = (message) => ({ [message.label]: message.samples })

exports.component = component
