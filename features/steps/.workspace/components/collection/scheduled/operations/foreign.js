export async function effect(input, context) {
  context.state.foreign ??= []
  context.state.foreign.push(input)
}
