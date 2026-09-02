import { secrets } from '../../handlers/export/secrets.js'

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
}

export const command = ['secrets <environment>']
export const desc = 'Export deployment secrets'

export { builder, secrets as handler }
