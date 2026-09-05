export async function effect (input, context) {
  context.state.calls ??= []
  context.state.calls.push(input)
}
