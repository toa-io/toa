/**
 * The filter, as an address carries one: `/.discovery/#search=pots`. A hash rather than a
 * querystring, because the page is a static document the gateway serves — what is in the
 * hash never reaches it, and asking for one filter is not asking for a different page.
 */
const SEARCH = 'search'

/** What an address says the filter is, or nothing where it says nothing of it. */
export function stated(hash: string): string | null {
  return new URLSearchParams(hash.replace(/^#/, '')).get(SEARCH)
}

/** The same address with the filter it is now, or without it where there is none. */
export function addressed(hash: string, query: string): string {
  const params = new URLSearchParams(hash.replace(/^#/, ''))

  if (query === '') params.delete(SEARCH)
  else params.set(SEARCH, query)

  // `URLSearchParams` escapes what a hash may hold as it stands; a path reads better
  const stamped = params.toString().replace(/%2F/gi, '/')

  return stamped === '' ? '' : '#' + stamped
}
