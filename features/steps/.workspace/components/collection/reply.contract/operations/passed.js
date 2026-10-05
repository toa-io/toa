export async function computation(_, context) {
  return await context.local.caused({})
}
