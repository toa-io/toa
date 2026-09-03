import { prepare } from '../../handlers/export/images.js'

const builder = (yargs) => {
  yargs
    .positional('target', {
      type: 'string',
      desc: 'Path to export to'
    })
    .option('path', {
      alias: 'p',
      group: 'Command options:',
      type: 'string',
      desc: 'Path to context',
      default: '.'
    })
    .option('mono', {
      group: 'Command options:',
      type: 'boolean',
      desc: 'Export a single image'
    })
}

export const command = ['images <target>', 'img']
export const desc = 'Export docker image sources'

export { builder, prepare as handler }
