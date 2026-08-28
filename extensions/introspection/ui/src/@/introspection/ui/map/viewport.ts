import { zoom, zoomIdentity, type ZoomTransform } from 'd3-zoom'
import { select } from 'd3-selection'
import type { Action } from 'svelte/action'

export { zoomIdentity, type ZoomTransform }

export interface Options {
  onchange: (transform: ZoomTransform) => void
}

const SCALE: [number, number] = [0.25, 2]

/**
 * Binds `d3-zoom` to the element. The map's own surface keeps the wheel where a card
 * has something to scroll, and the pointer where a card has something to press —
 * everything else pans and zooms.
 */
export const viewport: Action<HTMLElement, Options> = (element, options) => {
  let onchange = options.onchange

  const behavior = zoom<HTMLElement, unknown>()
    .scaleExtent(SCALE)
    .filter(allowed)
    .on('zoom', (event: { transform: ZoomTransform }) => onchange(event.transform))

  select<HTMLElement, unknown>(element).call(behavior).on('dblclick.zoom', null)

  return {
    update: (next: Options) => {
      onchange = next.onchange
    },
    destroy: () => {
      select<HTMLElement, unknown>(element).on('.zoom', null)
    },
  }
}

function allowed(event: MouseEvent | WheelEvent | TouchEvent): boolean {
  // d3's own rule: ctrl means the browser's zoom, and only the primary button drags
  if (event.ctrlKey && event.type !== 'wheel') return false

  // the primary button drags; the others belong to the browser
  if ('button' in event && event.button !== 0) return false

  if (event.type === 'wheel')
    return !within(event.target, '[data-scrollable]')

  return !within(event.target, 'button, a, [data-scrollable]')
}

function within(target: EventTarget | null, selector: string): boolean {
  return target instanceof Element && target.closest(selector) !== null
}
