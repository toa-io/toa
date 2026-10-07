export async function effect(input, context) {
  return await context.delay('delaying.pong', null, {
    interval: input.delay,
    overdue: input.overdue ?? null
  })
}
