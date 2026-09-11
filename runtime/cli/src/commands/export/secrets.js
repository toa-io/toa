import { needs, OPERATIONS } from '../../util/needs.js'

export const builder = (yargs) => {
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

// the handler and what it depends on load when the command runs, not when the program starts
export const handler = async (argv) => {
  const { secrets } = await needs(
    'export secrets',
    () => import('../../handlers/export/secrets.js'),
    OPERATIONS
  )

  return await secrets(argv)
}
