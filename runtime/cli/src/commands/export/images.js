import { needs, OPERATIONS } from '../../util/needs.js'

export const builder = (yargs) => {
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

// the handler and what it depends on load when the command runs, not when the program starts
export const handler = async (argv) => {
  const { prepare } = await needs(
    'export images',
    () => import('../../handlers/export/images.js'),
    OPERATIONS
  )

  return await prepare(argv)
}
