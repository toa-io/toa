const builder = (yargs) => {
  yargs
    .positional('image', {
      group: 'Command options:',
      type: 'string',
      desc: 'Docker image',
      default: 'alpine'
    })
    .example([['$0 shell'], ['$0 shell -- ping localhost']])
}

// the handler and what it depends on load when the command runs, not when the program starts
const handler = async (argv) => {
  const { shell } = await import('../handlers/shell.js')

  return await shell(argv)
}

export const command = 'shell [image]'
export const desc = 'Run interactive shell from the current Kubernetes context'

export { builder, handler }
