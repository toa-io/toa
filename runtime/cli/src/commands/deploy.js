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

// the handler and what it depends on load when the command runs, not when the program starts
const handler = async (argv) => {
  const { deploy } = await import('../handlers/deploy.js')

  return await deploy(argv)
}

export const command = 'deploy [environment]'
export const desc = 'Deploy context'

export { builder, handler }
