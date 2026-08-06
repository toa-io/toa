'use strict'

exports.computation = async (input, context) => {
  return context.span('compute', { factor: 2 }, async () => {
    context.logs.info('Computing', { value: input.value })

    return input.value * 2
  })
}
