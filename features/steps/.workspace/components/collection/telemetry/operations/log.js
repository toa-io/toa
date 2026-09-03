export const computation = (input, context) => {
  context.logs[input.level](input.message, input.attributes)
}
