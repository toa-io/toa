const builder = (yargs) => {
  yargs
    .positional('endpoint', {
      type: 'string',
      desc: 'Operation endpoint'
    })
    .positional('request', {
      type: 'string',
      desc: 'Request object'
    })
}

// the handler and what it depends on load when the command runs, not when the program starts
const handler = async (argv) => {
  const { call } = await import('../handlers/call.js')

  return await call(argv)
}

export const command = 'call <endpoint> [request]'
export const desc = 'Call operation'

export { builder, handler }
