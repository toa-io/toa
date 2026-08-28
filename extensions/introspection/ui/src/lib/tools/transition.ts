import { derived, writable, type Readable } from 'svelte/store'
import type { OnNavigate } from '@sveltejs/kit'

export function transit(fn?: (() => void) | (() => Promise<void>)): Promise<void> {
  if (document.startViewTransition === undefined)
    return Promise.resolve(fn?.())

  const fly = fn !== undefined

  if (fly) depart()

  return new Promise((resolve) => {
    const transition = document.startViewTransition(async () => {
      land()
      resolve(await fn?.())
    })

    // An aborted transition rejects `finished`, and the flight has to be unwound either
    // way: leaving `flying` set keeps view-transition-names on every flyer and breaks the
    // next transition. Handling both settlements also keeps the rejection from escaping.
    transition.finished.then(done, done)

    // and so does `ready`, which nothing here waits on: it rejects whenever the transition
    // is skipped — a hidden tab, a second one started on top of this — and an unhandled
    // rejection is not what a page should show for an animation it merely did without
    transition.ready.catch(ignore)

    function done() {
      if (fly) arrive()

      touchdown()
    }
  })
}

function ignore(): void {}

/**
 * SvelteKit navigation, wrapped. The update callback has to outlive the navigation it
 * lets through: it resolves to unblock the router, and only then waits for the new page
 * to be there. Returning any sooner captures the outgoing page as both the old state and
 * the new one, and the transition animates nothing at all.
 */
export function navigate(nav: OnNavigate): Promise<void> | void {
  if (nav.type === 'popstate' && nav.event.hasUAVisualTransition) return

  if (document.startViewTransition === undefined) return

  return new Promise((resolve) => {
    // typed `route`, so a page can style what a navigation does to the whole screen
    // without styling what every in-page `transit` does to it
    const transition = document.startViewTransition({
      types: ['route'],
      update: async () => {
        land()
        resolve()

        await nav.complete
      },
    })

    // the same unwinding `transit` does, and for the same reason: an aborted transition
    // rejects, and a name left on a departed element breaks the next one
    transition.finished.then(touchdown, touchdown)
    transition.ready.catch(ignore)
  })
}

let launch: Launch | null = null

export function takeoff(id: string, name: string, classes?: string) {
  if (launch !== null) clearInline(launch)

  const el = document.getElementById(id)

  if (el === null) {
    console.warn('No element to depart from', id)
    launch = null

    return
  }

  el.style.viewTransitionName = name

  if (classes !== undefined)
    el.style.viewTransitionClass = classes

  launch = { el, name, classes }
}

function land() {
  if (launch === null) return

  const clear = launch.el.style.viewTransitionName === launch.name

  launch.el.style.viewTransitionName = clear ? '' : launch.name
  launch.el.style.viewTransitionClass = clear ? '' : (launch.classes ?? '')
}

function touchdown() {
  if (launch === null) return

  // Keep `launch` alive after forward pass so land() can re-apply the name
  // on return transit (source → target → source morph).
  if (launch.el.style.viewTransitionName !== launch.name) return

  clearInline(launch)
  launch = null
}

function clearInline(launch: Launch) {
  launch.el.style.viewTransitionName = ''
  launch.el.style.viewTransitionClass = ''
}

const flying = writable<boolean>(false)
const flyers = new Set<Flyer>()

/**
 * Action to include an element in the non-navigation view transitions.
 *
 * @param node
 * @param options
 * @returns
 */
export function transition(node: HTMLElement, options: FlyOptions) {
  const flyer = {
    node,
    options,
    original: {
      name: node.style.viewTransitionName,
      classes: node.style.viewTransitionClass,
    },
  }

  flyers.add(flyer)

  return {
    destroy: () => flyers.delete(flyer),
  }
}

/**
 * Create a readable store that has `style` value when in non-navigation view transition.
 *
 * @param name
 * @param classes
 * @returns Readable<string | undefined>
 */
export function styles(name: string, classes?: string): Readable<string | undefined> {
  let value = `view-transition-name: ${name};`

  if (classes !== undefined)
    value += ` view-transition-class: ${classes};`

  return derived(flying, (flying) => flying ? value : undefined)
}

function depart() {
  flying.set(true)

  for (const flyer of flyers) {
    // could have changed
    flyer.original = {
      name: flyer.node.style.viewTransitionName,
      classes: flyer.node.style.viewTransitionClass,
    }

    flyer.node.style.viewTransitionName = flyer.options.name

    if (flyer.options.classes !== undefined)
      flyer.node.style.viewTransitionClass = flyer.options.classes
  }
}

function arrive() {
  for (const flyer of flyers) {
    if (flyer.original === undefined) continue

    flyer.node.style.viewTransitionName = flyer.original.name
    flyer.node.style.viewTransitionClass = flyer.original.classes
  }

  flying.set(false)
}

interface Flyer {
  node: HTMLElement
  options: FlyOptions
  original?: {
    name: string
    classes: string
  }
}

interface FlyOptions {
  /** view-transition-name */
  name: string
  /** view-transition-class */
  classes?: string
}

interface Launch {
  el: HTMLElement
  name: string
  classes?: string
}
