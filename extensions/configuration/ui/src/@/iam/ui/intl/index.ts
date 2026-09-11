import { derived } from 'svelte/store'
import { locale } from '$lib/intl'
export { locale } from '$lib/intl'
import { dictionaries } from './built.js'
export { dictionaries } from './built.js'
export type { Dictionary } from './types'
export type { Locale } from '$lib/intl'

export const dict = derived(locale, ($locale) => dictionaries[$locale])
