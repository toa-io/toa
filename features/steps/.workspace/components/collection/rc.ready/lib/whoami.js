// an addressed call to this process, as a caller given its name makes one
export async function whoami(context) {
  try {
    const name = await context.remote.rc.ready.whoami({ instance: context.instance })

    return { reached: name === context.instance }
  } catch (exception) {
    return { reached: false, code: exception.code }
  }
}
