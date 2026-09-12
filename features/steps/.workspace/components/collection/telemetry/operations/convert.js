export const computation = (input, context) => {
  context.metrics.conversions.add(1, { currency: input.currency })

  return input.amount
}
