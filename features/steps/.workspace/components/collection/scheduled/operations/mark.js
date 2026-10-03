import { appendFile } from 'node:fs/promises'
import { resolve } from 'node:path'

/**
 * A call of a schedule, recorded with when it arrived: in this process's own state, and — where
 * the scenario asked for one — in a file, which is the only place two processes meet.
 */
export async function effect(input, context) {
  context.state.marks ??= []
  context.state.marks.push({ at: input.at, received: Date.now() })

  if (process.env.MARKS !== undefined)
    await appendFile(resolve(process.cwd(), process.env.MARKS), `${input.at}\n`, 'utf8')
}
