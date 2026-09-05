export async function effect (input, context) {
  return await context.delay('default.delaying.pong', null,
    { interval: input.delay, overdue: input.overdue ?? null })
}
