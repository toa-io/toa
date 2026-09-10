export async function computation(_, context) {
  const answers = []

  for (let n = 0; n < 3; n++) {
    context.logs.warn('chain calling', { n })

    answers.push(await context.remote.halting.callee.echo({ input: { n } }))

    context.logs.warn('chain answered', { n })

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  context.logs.warn('chain done')

  return answers
}
