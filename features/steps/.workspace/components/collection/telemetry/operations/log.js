export const computation = (input, context) => {
  const attributes =
    input.error === undefined
      ? input.attributes
      : {
          ...input.attributes,
          error: Object.assign(new Error(input.error.message), { code: input.error.code })
        }

  context.logs[input.level](input.message, attributes)
}
