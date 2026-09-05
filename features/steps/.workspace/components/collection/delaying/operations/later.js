export async function effect (input, context) {
  return await context.delay('default.delaying.mark',
    { input: { note: input.note } }, { interval: input.delay, overdue: null })
}
