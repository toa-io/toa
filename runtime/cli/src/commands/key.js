export const builder = (yargs) => {
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

// the handler and what it depends on load when the command runs, not when the program starts
export const handler = async (argv) => {
  const { key } = await import('../handlers/key.js')

  return await key(argv)
}

export const command = 'key'
export const desc = 'Generate an encryption key'
