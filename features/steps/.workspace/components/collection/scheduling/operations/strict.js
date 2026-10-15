export async function effect(input, context) {
  context.state.strict ??= 0
  context.state.strict++
}
