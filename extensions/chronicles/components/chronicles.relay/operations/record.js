// a fact a component sent with `context.chronicles.send`, published by the extension
export async function effect(input, context) {
  await context.chronicles.record(input)
}
