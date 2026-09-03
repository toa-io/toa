import { mono } from '../handlers/mono.js'

const builder = (yargs) => {
  yargs
    .positional('paths', {
      type: 'string',
      desc: 'Paths to components',
      default: '.'
    })
    .array('paths')
    .option('kill', {
      group: 'Command options:',
      type: 'boolean',
      desc: 'Immediate shutdown'
    })
}

export const command = 'mono [paths...]'
export const desc = 'Run composition and services'

export { builder, mono as handler }
