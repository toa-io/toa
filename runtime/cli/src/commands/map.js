export const builder = (yargs) => {
  yargs
    .positional('environment', {
      type: 'string',
      default: 'local',
      desc: 'Environment name'
    })
    .option('path', {
      alias: 'p',
      group: 'Command options:',
      describe: 'Path to a Context',
      type: 'string',
      default: '.'
    })
    .option('as', {
      group: 'Command options:',
      describe: 'Output file path',
      type: 'string',
      default: '.map.json'
    })
    .example([['$0 map'], ['$0 map -p application'], ['$0 map production']])
}

// the handler and what it depends on load when the command runs, not when the program starts
export const handler = async (argv) => {
  const { map } = await import('../handlers/map.js')

  return await map(argv)
}

export const command = 'map [environment]'

export const describe = 'Export component contracts to a .map.json file'
