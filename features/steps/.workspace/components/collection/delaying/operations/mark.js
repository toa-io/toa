export async function effect (input, context) {
  context.state.marks ??= []
  context.state.marks.push(input.note)
}
