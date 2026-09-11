export async function computation(input, context) {
  return await context.storages[input.storage].head(input.path)
}
