import { writable } from 'svelte/store'
import { tick } from 'svelte'
import { base } from '$app/paths'
import { goto } from '$app/navigation'
import { slug } from './graph'

/**
 * The card that flies between the two screens of the map. One card carries the name at a
 * time — the one being left and the one being arrived at are the same component — and the
 * name is all the browser needs to morph it from the one box to the other.
 */
export const flying = writable<string | null>(null)

/** What both screens call that card. A constant: a vertex id is not a CSS ident. */
export const FLYER = 'card'

/** The house morph: the registry's spring, stretched rather than boxed. */
export const MORPH = 'transition-spring transition-morph'

/** Opens a vertex, having first said which card is about to leave. */
export async function open(id: string): Promise<void> {
  flying.set(id)

  // the name has to be on the element before the browser takes the leaving snapshot
  await tick()

  await goto(`${base}/map/${slug(id)}/`)
}

/**
 * Back to the whole map. Through history where there is history, so the browser's own
 * back and this go to the same place; a card opened by its address has none.
 */
export async function leave(): Promise<void> {
  if (window.navigation?.canGoBack === true) window.history.back()
  else await goto(`${base}/map/`)
}
