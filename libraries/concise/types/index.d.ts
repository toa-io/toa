declare namespace toa.cos {

  type validate = (schema: object) => boolean

  type expand = (cos: object, validate: validate) => object

}

export const expand: toa.cos.expand
