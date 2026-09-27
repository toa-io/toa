export async function computation(input, entry, context) {
  return { input, state: entry, context: context !== undefined }
}
