export async function effect(input, context) {
  context.state.overdue ??= []
  context.state.overdue.push({ at: input.at, received: Date.now() })
}
