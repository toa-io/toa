export function metrics(context, aspect) {
  // the instruments a component declared, built once and the same for every invocation
  context.metrics = aspect.invoke()
}
