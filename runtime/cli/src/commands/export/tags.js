import { needs, OPERATIONS } from '../../util/needs.js'

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

// the handler and what it depends on load when the command runs, not when the program starts
const handler = async (argv) => {
  const { tags } = await needs(
    'export tags',
    () => import('../../handlers/export/tags.js'),
    OPERATIONS
  )

  return await tags(argv)
}

export { builder, handler }
