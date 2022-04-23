'use strict'

class Compositions {
  #compositions

  constructor (context, instantiate) {
    if (context.compositions === undefined) context.compositions = []

    Compositions.#resolve(context)
    Compositions.#complete(context)

    this.#compositions = context.compositions.map(instantiate)
  }

  [Symbol.iterator] = () => this.#compositions.values()

  static #resolve (context) {
    const map = {}

    for (const component of context.components) {
      const id = component.locator.id

      map[id] = component
    }

    for (const composition of context.compositions) {
      composition.components = composition.components.map((id) => {
        const component = map[id]

        if (component === undefined) {
          throw new Error(`Unknown component '${id}' within composition '${composition.name}'`)
        }

        return component
      })
    }
  }

  static #complete (context) {
    const composed = new Set(context.compositions.map((composition) =>
      composition.components.map((component) => component.locator.label)
    ).flat())

    const names = new Set(context.compositions.map((composition) => composition.name))

    for (const component of context.components) {
      const { label } = component.locator

      if (composed.has(label)) continue
      if (names.has(label)) throw new Error(`Duplicate composition name '${label}'`)

      context.compositions.push({
        name: label,
        components: [component]
      })
    }
  }
}

exports.Compositions = Compositions
