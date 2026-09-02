import { shell } from '../handlers/shell.js'

const builder = (yargs) => {
  yargs
    .positional('image', {
      group: 'Command options:',
      type: 'string',
      desc: 'Docker image',
      default: 'alpine'
    })
    .example([
      ['$0 shell'],
      ['$0 shell -- ping localhost']
    ])
}

export const command = 'shell [image]'
export const desc = 'Run interactive shell from the current Kubernetes context'

export { builder, shell as handler }
