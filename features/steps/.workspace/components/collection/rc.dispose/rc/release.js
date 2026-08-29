const { writeFile } = require('node:fs/promises')
const { resolve } = require('node:path')

async function dispose () {
  await writeFile(resolve(process.cwd(), 'disposed'), 'ok\n')
}

module.exports = { dispose }
