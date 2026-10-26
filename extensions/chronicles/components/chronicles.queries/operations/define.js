export async function effect(input, context) {
  return await context.chronicles.define(input)
}
