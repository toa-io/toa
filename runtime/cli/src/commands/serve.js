const builder = (yargs) => {
  yargs.positional('path', {
    group: 'Command options:',
    type: 'string',
    desc: 'Path or a shortcut of an extension',
    default: '.'
  })
}

// the handler and what it depends on load when the command runs, not when the program starts
const handler = async (argv) => {
  const { serve } = await import('../handlers/serve.js')

  return await serve(argv)
}

export const command = 'serve [path]'
export const desc = 'Run an extension service'

export { builder, handler }
