import { rc as iam } from '@/iam/rc'
import { rc as discovery } from '@/discovery/rc'
import { browser } from '$app/environment'

if (browser) {
  iam()
  discovery()
}

// The gateway serves a directory of static files; routing belongs to the client.
export const ssr = false
export const prerender = false

export const trailingSlash = 'always'
