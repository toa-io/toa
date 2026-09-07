import { needs, OPERATIONS } from '../../util/needs.js'

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

// the handler and what it depends on load when the command runs, not when the program starts
const handler = async (argv) => {
  const { dump } = await needs(
    'export deployment',
    () => import('../../handlers/export/deployment.js'),
    OPERATIONS
  )

  return await dump(argv)
}

export { builder, handler }
