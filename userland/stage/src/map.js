import * as boot from '@toa.io/boot'

/**
 * What this process is given about the components it calls: the contract of the version each of
 * them runs.
 *
 * A composition staged here is given none unless a test states one, and a component the map
 * states nothing of is asked what it provides — which is what a run outside a deployment gets.
 *
 * @param {Record<string, toa.norm.Contract> | undefined} contracts
 * @returns {void}
 */
export const map = (contracts) => {
  boot.map.use(contracts)
}
