import { tags } from '../../handlers/export/tags.js'

const builder = (yargs) => {
  yargs
    .positional('environment', {
      type: 'string',
      desc: 'Deployment environment'
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
      desc: 'Export the single-image tag'
    })
}

export const command = ['tags <environment>']
export const desc = 'Export image tags'

export { builder, tags as handler }
