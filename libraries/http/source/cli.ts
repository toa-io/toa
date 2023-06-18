import * as readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { request } from '../'

const rl = readline.createInterface({ input, output })

;(async function (): Promise<void> {
  let lines = ''
  let line: string

  do {
    line = await rl.question('')
    lines += line + '\n'
  } while (line !== '')

  const response = await request(lines + '\n')

  console.log(response)

  rl.close()
})()
  .catch((e) => {
    console.error(e.message)
    process.exit(1)
  })
