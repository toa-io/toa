const builder = (yargs) => {
  yargs
    .option('path', {
      alias: 'p',
      group: 'Command options:',
      type: 'string',
      desc: 'Path to the Context',
      default: '.'
    })
    .option('environment', {
      alias: 'e',
      group: 'Command options:',
      type: 'string',
      desc: 'Environment the Context is read for'
    })
    .option('components', {
      alias: 'c',
      group: 'Command options:',
      type: 'string',
      desc: 'Paths to components that belong to no Context, instead of reading one'
    })
    .array('components')
    .option('quiet', {
      alias: 'q',
      group: 'Command options:',
      type: 'boolean',
      desc: 'Print nothing'
    })
    .example([
      ['$0 types'],
      ['$0 types -p ./application'],
      ['$0 types -c ./components/*']
    ])
}

// the handler and what it depends on load when the command runs, not when the program starts
const handler = async (argv) => {
  const { types } = await import('../handlers/types.js')

  return await types(argv)
}

export const command = 'types'
export const desc = 'Generate types for a Context and its components'

export { builder, handler }
