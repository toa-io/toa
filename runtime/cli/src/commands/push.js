const builder = (yargs) => {
  yargs.option('path', {
    alias: 'p',
    group: 'Command options:',
    type: 'string',
    desc: 'Path to context',
    default: '.'
  })
}

// the handler and what it depends on load when the command runs, not when the program starts
const handler = async (argv) => {
  const { push } = await import('../handlers/push.js')

  return await push(argv)
}

export const command = 'push'
export const desc = 'Build and push Docker images'

export { builder, handler }
