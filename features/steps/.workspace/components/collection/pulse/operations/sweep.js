import { appendFile } from 'node:fs/promises'
import { resolve } from 'node:path'

/**
 * A pulse every replica makes, so a call is recorded where it ran: in this process's own state,
 * and — where the scenario asked for one — in a file, which is the only place two processes meet.
 */
export async function effect(input, context) {
  context.state.sweeps ??= []
  context.state.sweeps.push(input)

  if (process.env.SWEEPS !== undefined)
    await appendFile(resolve(process.cwd(), process.env.SWEEPS), `${process.pid}\n`, 'utf8')
}
