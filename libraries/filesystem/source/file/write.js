'use strict'

const { writeFile } = require('node:fs/promises')
const { writeFileSync } = require('node:fs')

const write = (path, contents) => writeFile(path, contents, 'utf8')

write.sync = (path, contents) => writeFileSync(path, contents, 'utf8')

exports.write = write
