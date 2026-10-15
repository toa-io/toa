export async function effect(input, context) {
  context.state.marks ??= []
  context.state.marks.push({ note: input.note, at: input.at, received: Date.now() })
}
