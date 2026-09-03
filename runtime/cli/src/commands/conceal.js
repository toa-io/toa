import { conceal } from '../handlers/conceal.js'

const builder = (yargs) => {
  yargs
    .positional('secret', {
      type: 'string'
    })
    .positional('key-values', {
      type: 'string',
      array: true,
      desc: 'Secret key-value pairs'
    })
    .option('namespace', {
      alias: 'n',
      group: 'Command options:',
      type: 'string',
      desc: 'Target Kubernetes namespace'
    })
    .option('interactive', {
      alias: 'i',
      group: 'Command options:',
      describe: 'Prompt for secrets',
      type: 'boolean',
      default: false
    })
    .option('environment', {
      alias: 'e',
      group: 'Command options:',
      describe: 'Environment name for interactive mode',
      type: 'string'
    })
    .option('path', {
      alias: 'p',
      group: 'Command options:',
      describe: 'Path to a Context for interactive mode',
      type: 'string',
      default: '.'
    })
    .example([
      ['$0 conceal -i'],
      ['$0 conceal credentials username=developer'],
      ['$0 conceal credentials username=developer password=secret'],
      ['$0 conceal credentials username=developer --namespace app']
    ])
}

export const command = 'conceal [secret] [key-values...]'
export const desc = 'Deploy a secret'

export { builder, conceal as handler }
