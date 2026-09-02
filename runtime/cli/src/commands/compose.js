// noinspection JSCheckFunctionSignatures

import { compose } from '../handlers/compose.js'

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
    .option('dock', {
      group: 'Command options:',
      type: 'boolean',
      desc: 'Run in Docker'
    })
    .option('context', {
      group: 'Command options:',
      type: 'string',
      desc: 'Path to the Context (used with --dock)',
      default: '.'
    })
    .option('bindings', {
      group: 'Command options:',
      type: 'string',
      desc: 'OBSOLETE'
    })
    .array('bindings')
    .example([
      ['$0 compose ./component'],
      ['$0 compose ./first ./second'],
      ['$0 compose ./components/**/'],
      ['$0 compose ./a/**/ ./b/**/']
    ])
}

export const command = 'compose [paths...]'
export const desc = 'Run composition'

export { builder, compose as handler }
