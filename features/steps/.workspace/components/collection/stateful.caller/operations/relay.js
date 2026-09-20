// an addressed call made from a component, as a component makes one: to the process named, or to
// its own where none is; or an ordinary call, which names none
export async function computation(input, context) {
  const request = { input: input.input ?? null }

  if (input.ordinary !== true) request.instance = input.instance ?? context.instance

  const options = {}

  if (input.timeout !== undefined) options.timeout = input.timeout

  // a signal its caller aborted before making the call
  if (input.aborted === true) {
    const controller = new AbortController()

    controller.abort()
    options.signal = controller.signal
  }

  return await context.remote.stateful.counter[input.endpoint](request, options)
}
