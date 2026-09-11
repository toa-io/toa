import type { SvelteMap } from 'svelte/reactivity'
import type { Action } from 'svelte/action'

/** Where a row of a card sits inside it, in layout values. */
export interface Row {
  top: number
  height: number
  /** Where its content ends, which is where a line leaving it starts. */
  right: number
}

export interface Rows {
  into: SvelteMap<string, Row>
  /** The card these rows belong to: two open cards can name the same operation. */
  of: string
}

/**
 * Follows the rows of an opened card, so a line can point at the operation it asks for
 * rather than at the card holding it. Rows move whenever one of them is opened or the
 * card is replaced, and neither is a resize of anything the map itself measures.
 */
export const rows: Action<HTMLElement, Rows> = (element, options) => {
  const resizes = new ResizeObserver(() => take())
  const mutations = new MutationObserver(() => take())

  let { into, of } = options

  /** What this card put in the map, so it never clears what another card put there. */
  let mine = new Set<string>()

  resizes.observe(element)
  mutations.observe(element, { childList: true, subtree: true })

  take()

  return {
    update: (next: Rows) => {
      into = next.into
      of = next.of

      take()
    },
    destroy: () => {
      resizes.disconnect()
      mutations.disconnect()

      for (const id of mine) into.delete(id)
    },
  }

  function take(): void {
    const seen = new Set<string>()

    for (const row of element.querySelectorAll<HTMLElement>('[data-row]')) {
      if (row.dataset.row === undefined) continue

      const id = `${of} ${row.dataset.row}`

      seen.add(id)

      const at = { top: corner(row).top, height: row.offsetHeight, right: extent(row) }
      const known = into.get(id)

      if (
        known === undefined ||
        known.top !== at.top ||
        known.height !== at.height ||
        known.right !== at.right
      )
        into.set(id, at)
    }

    for (const id of mine) if (!seen.has(id)) into.delete(id)

    mine = seen
  }

  /**
   * A row is as wide as the card, and its text is not; a line drawn from the row's own
   * edge would start in the empty space after the words. So the end of the content is
   * measured instead — the far side of whichever child reaches furthest.
   */
  function extent(row: HTMLElement): number {
    let right = 0

    for (const child of row.children)
      if (child instanceof HTMLElement)
        right = Math.max(right, corner(child).left + child.offsetWidth)

    return right === 0 ? corner(row).left + row.offsetWidth : right
  }

  /** Layout offset within the card, however many positioned boxes stand between. */
  function corner(node: HTMLElement): { top: number; left: number } {
    const at = { top: 0, left: 0 }

    let box: HTMLElement | null = node

    while (box !== null && box !== element) {
      at.top += box.offsetTop
      at.left += box.offsetLeft
      box = box.offsetParent as HTMLElement | null
    }

    return at
  }
}
