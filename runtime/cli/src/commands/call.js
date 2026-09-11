import { needs, RUNTIME } from '../util/needs.js'

export const builder = (yargs) => {
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
export const handler = async (argv) => {
  const { call } = await needs('call', () => import('../handlers/call.js'), RUNTIME)

  return await call(argv)
}

export const command = 'call <endpoint> [request]'
export const desc = 'Call operation'
