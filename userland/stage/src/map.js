import * as boot from '@toa.io/boot'

/**
 * Which version of each component a lookup made in this process asks for.
 *
 * A composition staged here is given none unless a test states one, and a lookup with no version
 * goes to the name every version of a component answers on — which is what a run outside a
 * deployment gets.
 *
 * @param {Record<string, string> | undefined} versions
 * @returns {void}
 */
export const map = (versions) => {
  boot.map.use(versions)
}
