export async function transition(input, entry, context) {
  return { input, state: entry, context: context !== undefined }
}
