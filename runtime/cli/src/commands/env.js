import { needs, OPERATIONS } from '../util/needs.js'

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
    .option('as', {
      group: 'Command options:',
      describe: 'Output file path',
      type: 'string',
      default: '.env'
    })
    .option('interactive', {
      alias: 'i',
      group: 'Command options:',
      describe: 'Prompt for secrets',
      type: 'boolean',
      default: false
    })
    .option('dev', {
      alias: 'd',
      group: 'Command options:',
      describe: 'Fill secrets with local/dev defaults',
      type: 'boolean',
      default: false
    })
}

// the handler and what it depends on load when the command runs, not when the program starts
const handler = async (argv) => {
  const { env } = await needs('env', () => import('../handlers/env.js'), OPERATIONS)

  return await env(argv)
}

export const command = 'env [environment]'
export const desc = 'Select environment'

export { builder, handler }
