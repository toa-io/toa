import { push } from '../handlers/push.js'

const builder = (yargs) => {
  yargs
    .option('path', {
      alias: 'p',
      group: 'Command options:',
      type: 'string',
      desc: 'Path to context',
      default: '.'
    })
}

export const command = 'push'
export const desc = 'Build and push Docker images'

export { builder, push as handler }
