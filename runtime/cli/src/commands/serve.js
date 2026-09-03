import { serve } from '../handlers/serve.js'

const builder = (yargs) => {
  yargs
    .positional('path', {
      group: 'Command options:',
      type: 'string',
      desc: 'Path or a shortcut of an extension',
      default: '.'
    })
}

export const command = 'serve [path]'
export const desc = 'Run an extension service'

export { builder, serve as handler }
