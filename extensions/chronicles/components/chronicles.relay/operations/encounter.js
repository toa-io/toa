// the encounters of a batch a client sent, published by the extension
export async function effect(input, context) {
  await context.chronicles.encounter(input.encounters)
}
