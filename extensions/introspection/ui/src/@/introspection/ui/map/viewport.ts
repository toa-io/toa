import { zoom, zoomIdentity, zoomTransform, type ZoomTransform } from 'd3-zoom'
import { select } from 'd3-selection'
import type { Action } from 'svelte/action'

export { zoomIdentity, type ZoomTransform }

export interface Controls {
  /** Puts the map back where it opens: unpanned, unzoomed. */
  reset: () => void
}

export interface Options {
  onchange: (transform: ZoomTransform) => void
  onready?: (controls: Controls) => void
}

const SCALE: [number, number] = [0.25, 2]

/** What a wheel reporting lines rather than pixels means by one of them. */
const LINE = 16

/**
 * Binds `d3-zoom` to the element. The map scrolls the way a page does and zooms only when
 * asked — with ⌘ or Ctrl held, which is also how a trackpad pinch arrives. The map's own
 * surface keeps the wheel where a card has something to scroll, and the pointer where a
 * card has something to press.
 */
export const viewport: Action<HTMLElement, Options> = (element, options) => {
  let onchange = options.onchange

  const behavior = zoom<HTMLElement, unknown>()
    .scaleExtent(SCALE)
    .filter(allowed)
    .on('zoom', (event: { transform: ZoomTransform }) => onchange(event.transform))

  const selection = select<HTMLElement, unknown>(element)

  selection.call(behavior).on('dblclick.zoom', null)

  // not passive: a scroll over the map moves the map, and nothing else
  element.addEventListener('wheel', pan, { passive: false })

  options.onready?.({ reset: () => behavior.transform(selection, zoomIdentity) })

  return {
    update: (next: Options) => {
      onchange = next.onchange
    },
    destroy: () => {
      element.removeEventListener('wheel', pan)
      select<HTMLElement, unknown>(element).on('.zoom', null)
    },
  }

  /** What the filter turns away: a plain scroll, which moves the map rather than scaling it. */
  function pan(event: WheelEvent): void {
    if (zooming(event) || within(event.target, '[data-scrollable]')) return

    event.preventDefault()

    const step = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? LINE : 1

    // divided by the scale, so a scroll covers the same distance on screen at every zoom
    const { k } = zoomTransform(element)

    behavior.translateBy(selection, (-event.deltaX * step) / k, (-event.deltaY * step) / k)
  }
}

function allowed(event: MouseEvent | WheelEvent | TouchEvent): boolean {
  // the wheel scales only when it is asked to; a plain scroll is panned by hand above
  if (event.type === 'wheel')
    return zooming(event as WheelEvent) && !within(event.target, '[data-scrollable]')

  // d3's own rule: ctrl means the browser's own gesture
  if (event.ctrlKey) return false

  // the primary button drags; the others belong to the browser
  if ('button' in event && event.button !== 0) return false

  return !within(event.target, 'button, a, [data-scrollable]')
}

/** ⌘ on Apple, Ctrl elsewhere — and a trackpad pinch arrives as a ctrl-wheel on both. */
function zooming(event: WheelEvent): boolean {
  return event.ctrlKey || event.metaKey
}

function within(target: EventTarget | null, selector: string): boolean {
  return target instanceof Element && target.closest(selector) !== null
}
