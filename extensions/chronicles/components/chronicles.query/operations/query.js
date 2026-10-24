export async function computation(input, context) {
  return await context.chronicles.query(input.sql)
}
