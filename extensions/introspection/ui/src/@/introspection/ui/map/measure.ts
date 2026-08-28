import type { SvelteMap } from 'svelte/reactivity'
import type { Action } from 'svelte/action'
import type { Size } from './layout'

export interface Measured {
  into: SvelteMap<string, Size>
  id: string
}

/**
 * Records what a card actually occupies, so the layout can place the next one under it
 * and an edge can meet it where it ends. Layout values, so an ancestor's scale does not
 * change what is measured.
 */
export const measure: Action<HTMLElement, Measured> = (element, options) => {
  let { into, id } = options

  const observer = new ResizeObserver(() => take())

  observer.observe(element)

  return {
    update: (next: Measured) => {
      into = next.into
      id = next.id

      take()
    },
    destroy: () => observer.disconnect(),
  }

  function take(): void {
    into.set(id, { width: element.offsetWidth, height: element.offsetHeight })
  }
}
