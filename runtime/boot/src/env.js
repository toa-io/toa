import { readFileSync } from 'node:fs'
import dotenv from 'dotenv'
import { environment, findUp } from '@toa.io/generic'

/*
 * A local run reads what `toa env` wrote. What the file says goes to the environment store
 * and never into `process.env`: a `.env` is where a local run keeps its secrets, and a
 * component's code must not find them. A variable already set is left alone, as `dotenv`
 * left it, so what the environment says still wins — and reading the file costs nothing
 * where there is none: a deployment has no `.env` to find.
 *
 * It used to be read only where `TOA_ENV` was unset, taking that one variable as proof the
 * environment had been injected. Setting it for any other reason then dropped the file
 * whole, and every variable in it with it.
 */
export function load(path) {
  environment.absorbEntries(dotenv.parse(readFileSync(path, 'utf8')))
}

const path = findUp('.env')

if (path !== undefined) load(path)
