export async function transition(input, entries, context) {
  for (const entry of entries) entry.count += 1

  if (input.touch !== undefined)
    await context.local.touch({ input: {}, query: { id: input.touch } })

  return { bumped: entries.length }
}
