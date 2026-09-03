import { call } from '../handlers/call.js'

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

export const command = 'call <endpoint> [request]'
export const desc = 'Call operation'

export { builder, call as handler }
