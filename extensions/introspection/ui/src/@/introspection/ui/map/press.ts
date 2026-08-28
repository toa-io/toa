import type { Action } from 'svelte/action'

/** Told whether the press was held with shift, which is how a card is asked for less. */
type Handler = (shift: boolean) => void

/** How far the pointer may travel and still have meant the card rather than the map. */
const SLACK = 4

/**
 * A card is pressed to open it and dragged to pan the map, and the two gestures start
 * the same way. This tells them apart by distance, so a card never opens at the end of
 * a pan across it.
 */
export const press: Action<HTMLElement, Handler> = (element, handler) => {
  let act = handler
  let from: { x: number; y: number } | null = null

  element.addEventListener('pointerdown', down)
  element.addEventListener('click', click)
  element.addEventListener('keydown', key)

  return {
    update: (next: Handler) => (act = next),
    destroy: () => {
      element.removeEventListener('pointerdown', down)
      element.removeEventListener('click', click)
      element.removeEventListener('keydown', key)
    },
  }

  function down(event: PointerEvent): void {
    from = { x: event.clientX, y: event.clientY }
  }

  function click(event: MouseEvent): void {
    const start = from

    from = null

    // no pointer at all is a click raised some other way, and nothing dragged it here
    if (start !== null && Math.hypot(event.clientX - start.x, event.clientY - start.y) > SLACK)
      return

    // a control inside the card answers for itself; the card answers for the rest of it
    if (event.target instanceof Element) {
      const control = event.target.closest('button, a')

      if (control !== null && control !== element) return
    }

    act(event.shiftKey)
  }

  function key(event: KeyboardEvent): void {
    if (event.target !== element) return

    if (event.key !== 'Enter' && event.key !== ' ') return

    event.preventDefault()
    act(event.shiftKey)
  }
}
