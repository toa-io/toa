import { manifest } from '../../handlers/export/manifest.js'

const builder = (yargs) => {
  yargs
    .option('error', {
      alias: 'e',
      group: 'Command options:',
      type: 'boolean',
      desc: 'Print errors only'
    })
    .option('path', {
      alias: 'p',
      group: 'Command options:',
      type: 'string',
      desc: 'Path to a component',
      default: '.'
    })
    .option('jsonpath', {
      alias: 'j',
      group: 'Command options:',
      type: 'string',
      desc: 'JSONPath expression'
    })
    .option('output', {
      alias: 'o',
      group: 'Command options:',
      choices: ['yaml', 'json'],
      desc: 'Output format',
      default: 'yaml'
    })
}

export const command = ['manifest', 'man']
export const desc = 'Print manifest'

export { builder, manifest as handler }
