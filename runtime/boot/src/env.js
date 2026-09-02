'use strict'

const findUp = require('find-up')

async function setup () {
  const path = await findUp('.env')

  if (path !== undefined) require('dotenv').config({ path })
}

if (!('TOA_ENV' in process.env)) {
  (async () => {
    await setup()
  })()
}
