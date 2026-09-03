export async function computation (object, context) {
  await context.stash.store('object', object)
}
