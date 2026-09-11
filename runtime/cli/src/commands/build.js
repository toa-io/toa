import { needs, OPERATIONS } from '../util/needs.js'

export const builder = (yargs) => {
  yargs
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
      desc: 'Build a single image'
    })
}

// the handler and what it depends on load when the command runs, not when the program starts
export const handler = async (argv) => {
  const { build } = await needs('build', () => import('../handlers/build.js'), OPERATIONS)

  return await build(argv)
}

export const command = 'build'
export const desc = 'Build Docker images'
