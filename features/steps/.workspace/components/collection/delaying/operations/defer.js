export async function computation(input, context) {
  // the delayed call is a computation; handing it over is what writes
  return await context.delay('default.delaying.marks', null, {
    interval: input.delay,
    overdue: null
  })
}
