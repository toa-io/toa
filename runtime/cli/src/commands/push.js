import { needs, OPERATIONS } from '../util/needs.js'

const builder = (yargs) => {
  yargs
    .positional('environment', {
      type: 'string',
      default: 'default',
      desc: 'Deployment environment'
    })
    .option('path', {
      alias: 'p',
      group: 'Command options:',
      type: 'string',
      desc: 'Path to context',
      default: '.'
    })
}

// the handler and what it depends on load when the command runs, not when the program starts
const handler = async (argv) => {
  const { push } = await needs('push', () => import('../handlers/push.js'), OPERATIONS)

  return await push(argv)
}

export const command = 'push [environment]'
export const desc = 'Build and push Docker images'

export { builder, handler }
