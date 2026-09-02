import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

async function dispose () {
  await writeFile(resolve(process.cwd(), 'disposed'), 'ok\n')
}

export { dispose }
