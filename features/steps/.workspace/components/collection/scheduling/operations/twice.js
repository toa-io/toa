export async function effect(input, context) {
  const request = { input: { note: input.note } }
  const first = await context.schedule('default.scheduling.mark', request, input.schedule)
  const second = await context.schedule(
    'default.scheduling.mark',
    request,
    input.schedule
  )

  return { same: first === second }
}
