import { key } from '../handlers/key.js'

const builder = (yargs) => {
  yargs
    .option('public', {
      group: 'Command options:',
      describe: 'Generate a public/private key pair',
      type: 'boolean',
      default: false
    })
    .option('format', {
      group: 'Command options:',
      describe: 'Secret key format',
      choices: ['jwe', 'paseto'],
      default: 'jwe'
    })
}

export const command = 'key'
export const desc = 'Generate an encryption key'

export { builder, key as handler }
