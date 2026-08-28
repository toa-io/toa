import type { Action } from 'svelte/action'

/**
 * Which row of a card the pointer is on, delegated: the rows are drawn by the card
 * itself, several components deep, and none of them has to know it is on a map.
 * Keyboard focus answers the same way, so a row reached by tabbing lights its lines too.
 */
export const hover: Action<HTMLElement, (row: string | null) => void> = (element, handler) => {
  let tell = handler

  element.addEventListener('mouseover', enter)
  element.addEventListener('mouseleave', leave)
  element.addEventListener('focusin', enter)
  element.addEventListener('focusout', leave)

  return {
    update: (next: (row: string | null) => void) => (tell = next),
    destroy: () => {
      element.removeEventListener('mouseover', enter)
      element.removeEventListener('mouseleave', leave)
      element.removeEventListener('focusin', enter)
      element.removeEventListener('focusout', leave)
    },
  }

  function enter(event: Event): void {
    const on = event.target instanceof Element ? event.target.closest('[data-row]') : null

    tell(on?.getAttribute('data-row') ?? null)
  }

  function leave(): void {
    tell(null)
  }
}
