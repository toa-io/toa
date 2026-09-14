import * as origin from './net'

/**
 * Halts the deployment: every process goes quiet, and where the deployment is seen still it
 * stops and comes back on its own when `seconds` are up.
 *
 * What answers is the record having been written. What it does reaches this page as well, so
 * whatever is on screen afterwards is a page whose API has stopped answering.
 */
export async function halt(seconds: number, quiescence: number): Promise<void | Error> {
  return await origin.halt(seconds, quiescence)
}
