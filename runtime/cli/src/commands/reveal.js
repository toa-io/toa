import { needs, OPERATIONS } from '../util/needs.js'

const builder = (yargs) => {
  yargs.positional('secret', {
    type: 'string'
  })
}

// the handler and what it depends on load when the command runs, not when the program starts
const handler = async (argv) => {
  const { reveal } = await needs(
    'reveal',
    () => import('../handlers/reveal.js'),
    OPERATIONS
  )

  return await reveal(argv)
}

export const command = 'reveal <secret>'
export const desc = 'Print keys and values of a secret'

export { builder, handler }
