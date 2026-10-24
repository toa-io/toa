// a fact a component sent with `context.chronicles.send`, written by the extension
export async function effect(input, context) {
  await context.chronicles.record(input)
}
