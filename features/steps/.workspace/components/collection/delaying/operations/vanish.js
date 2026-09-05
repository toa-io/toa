export async function effect (input, context) {
  const id = await context.delay('default.delaying.mark',
    { input: { note: input.note } }, { interval: input.delay, overdue: null })

  await context.delay.cancel(id)

  return id
}
