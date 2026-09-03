import dotenv from 'dotenv'
import { findUp } from '@toa.io/generic'

async function setup () {
  const path = findUp('.env')

  if (path !== undefined) dotenv.config({ path })
}

if (!('TOA_ENV' in process.env)) {
  (async () => {
    await setup()
  })()
}
