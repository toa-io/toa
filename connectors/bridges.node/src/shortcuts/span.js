function span (context, aspect) {
  context.span = (...args) => aspect.invoke(context.operation, ...args)
}

export { span }
