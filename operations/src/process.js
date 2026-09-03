import { execa } from 'execa'

/**
 * @implements {toa.operations.Process}
 */
export class Process {
  async execute (cmd, args, options = {}) {
    console.log('toa>', cmd, args.join(' '))

    const command = execa(cmd, args)

    if (options.silently !== true) {
      command.stdout.pipe(process.stdout)
      command.stderr.pipe(process.stderr)
    }

    const result = await command

    return result.stdout
  }
}
