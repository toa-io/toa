import { dump } from '../../handlers/export/deployment.js'

const builder = (yargs) => {
  yargs
    .positional('target', {
      type: 'string',
      desc: 'Path to export to'
    })
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
      desc: 'Export a single-image deployment'
    })
}

export const command = ['deployment <environment> <target>', 'dep']
export const desc = 'Export context deployment'

export { builder, dump as handler }
