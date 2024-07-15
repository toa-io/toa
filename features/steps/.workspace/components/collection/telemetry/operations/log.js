'use strict'

exports.computation = (input, context) => {
  context.logs[input.level](input.message, input.attributes)
}
