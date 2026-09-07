import { needs, RUNTIME } from '../util/needs.js'

const builder = (yargs) => {
  yargs
    .positional('paths', {
      type: 'string',
      desc: 'Paths to components',
      default: '.'
    })
    .array('paths')
    .option('kill', {
      group: 'Command options:',
      type: 'boolean',
      desc: 'Immediate shutdown'
    })
}

// the handler and what it depends on load when the command runs, not when the program starts
const handler = async (argv) => {
  const { mono } = await needs('mono', () => import('../handlers/mono.js'), RUNTIME)

  return await mono(argv)
}

export const command = 'mono [paths...]'
export const desc = 'Run composition and services'

export { builder, handler }
