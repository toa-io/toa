import { reveal } from '../handlers/reveal.js'

const builder = (yargs) => {
  yargs
    .positional('secret', {
      type: 'string'
    })
}

export const command = 'reveal <secret>'
export const desc = 'Print keys and values of a secret'

export { builder, reveal as handler }
