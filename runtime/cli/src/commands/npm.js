const builder = (yargs) => {
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
    .option('dry-run', {
      alias: 'n',
      group: 'Command options:',
      describe: 'Print what is missing instead of installing it',
      type: 'boolean',
      default: false
    })
}

// what it reads is a declaration, so it needs neither the runtime nor the deployment library
const handler = async (argv) => {
  const { npm } = await import('../handlers/npm.js')

  return await npm(argv)
}

export const command = 'npm [environment]'
export const desc = "Install what this Context's components declare"

export { builder, handler }
