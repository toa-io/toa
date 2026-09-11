// holds the call for as many milliseconds as it is given
export async function computation(ms, context) {
  await new Promise((resolve) => setTimeout(resolve, ms))

  return context.instance
}
