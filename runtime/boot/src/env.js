import dotenv from 'dotenv'
import { findUp } from '@toa.io/generic'

/*
 * A local run reads what `toa env` wrote. `dotenv` leaves a variable that is already set
 * alone, so what the environment says still wins and reading the file costs nothing where
 * there is none — a deployment has no `.env` to find.
 *
 * It used to be read only where `TOA_ENV` was unset, taking that one variable as proof the
 * environment had been injected. Setting it for any other reason then dropped the file
 * whole, and every variable in it with it.
 */
const path = findUp('.env')

if (path !== undefined) dotenv.config({ path })
