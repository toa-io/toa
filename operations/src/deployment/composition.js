export class Composition {
  name
  image
  /** @type {string[]} */
  components

  constructor (composition, image) {
    this.name = composition.name
    this.image = image.reference
    this.components = composition.components.map(component)
    this.resources = composition.resources

    // the extensions whose services this composition runs, as `TOA_SERVICES` for the process
    if (composition.services !== undefined) this.services = composition.services
  }
}

const component = (component) => component.locator.label
