import { needs, RUNTIME } from '../util/needs.js'

export const builder = (yargs) => {
  yargs
    .positional('paths', {
      type: 'string',
      desc: 'Path or a shortcut of an extension',
      default: '.'
    })
    .array('paths')
    .example([
      ['$0 serve exposition'],
      ['$0 serve exposition configuration'],
      ['$0 serve ./extensions/exposition']
    ])
}

// the handler and what it depends on load when the command runs, not when the program starts
export const handler = async (argv) => {
  const { serve } = await needs('serve', () => import('../handlers/serve.js'), RUNTIME)

  return await serve(argv)
}

export const command = 'serve [paths...]'
export const desc = 'Run an extension service'
