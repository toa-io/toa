export class Service {
  constructor (service, image) {
    Object.assign(this, service)

    this.name = service.group + '-' + service.name
    this.image = image.reference
  }
}
