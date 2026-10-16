export async function effect(input, context) {
  const id = await context.schedule(
    'default.scheduling.mark',
    { input: { note: 'never' } },
    input.schedule
  )

  await context.schedule.cancel(id)

  return id
}
