export async function effect(input, context) {
  const request = { input: { note: 'again' } }
  const first = await context.schedule('default.scheduling.mark', request, input.schedule)

  await context.schedule.cancel(first)

  const second = await context.schedule(
    'default.scheduling.mark',
    request,
    input.schedule
  )

  return { same: first === second }
}
