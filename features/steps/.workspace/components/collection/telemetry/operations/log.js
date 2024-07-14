'use strict'

exports.computation = (input, context) => {
  context.logs[input.severity](input.message, input.attributes)
}
