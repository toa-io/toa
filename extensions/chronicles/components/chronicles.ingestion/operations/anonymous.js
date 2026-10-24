// what anyone sent, checked and written by the extension
export async function effect(input, context) {
  return await context.chronicles.ingest(input, null)
}
