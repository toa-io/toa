import { build } from '../handlers/build.js'

const builder = (yargs) => {
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

export const command = 'build'
export const desc = 'Build Docker images'

export { builder, build as handler }
