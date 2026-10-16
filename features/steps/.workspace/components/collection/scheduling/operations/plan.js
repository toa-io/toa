export async function effect(input, context) {
  const options = { schedule: input.schedule }

  if (input.zone !== undefined) options.zone = input.zone
  if (input.overdue !== undefined) options.overdue = input.overdue
  if (input.expires !== undefined) options.expires = Date.now() + input.expires

  const request = {
    input: input.input === undefined ? { note: input.note ?? 'mark' } : input.input
  }

  return await context.schedule(
    input.target ?? 'default.scheduling.mark',
    request,
    options
  )
}
