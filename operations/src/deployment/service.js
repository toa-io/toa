// a service is what a deployment carries, and it is constructed
// oxlint-disable-next-line typescript/no-extraneous-class
export class Service {
  constructor (service, image) {
    Object.assign(this, service)

    this.name = service.group + '-' + service.name
    this.image = image.reference
  }
}
