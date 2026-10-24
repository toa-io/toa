// what a browser sent, checked and written by the extension: a batch as JSON, or as the text
// `navigator.sendBeacon` sends
export async function effect(input, context) {
  return await context.chronicles.ingest(input)
}
