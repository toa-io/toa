import { deploy } from '../handlers/deploy.js'

const builder = (yargs) => {
  yargs
    .positional('environment', {
      type: 'string',
      default: 'default',
      desc: 'Deployment environment'
    })
    .option('path', {
      alias: 'p',
      group: 'Command options:',
      type: 'string',
      desc: 'Path to context',
      default: '.'
    })
    .option('dry', {
      alias: 'd',
      group: 'Command options:',
      boolean: true,
      desc: 'Dry run'
    })
    .option('namespace', {
      alias: 'n',
      group: 'Command options:',
      type: 'string',
      desc: 'Target namespace'
    })
    .option('wait', {
      alias: 'w',
      group: 'Command options:',
      boolean: true,
      desc: 'Wait for deployment ready state'
    })
    .option('timeout', {
      alias: 't',
      group: 'Command options:',
      type: 'string',
      desc: 'Deployment timeout'
    })
    .option('mono', {
      group: 'Command options:',
      type: 'boolean',
      desc: 'Deploy as a single image'
    })
}

export const command = 'deploy [environment]'
export const desc = 'Deploy context'

export { builder, deploy as handler }
