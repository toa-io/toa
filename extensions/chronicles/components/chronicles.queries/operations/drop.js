export async function effect(input, context) {
  return await context.chronicles.drop(input.name)
}
