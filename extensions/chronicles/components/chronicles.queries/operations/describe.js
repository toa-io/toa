export async function computation(_, context) {
  return await context.chronicles.describe()
}
