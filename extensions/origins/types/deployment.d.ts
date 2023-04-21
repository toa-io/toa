declare namespace toa.origins {

  namespace annotation {
    type Component = Record<string, string>
  }

  type Annotations = Record<string, annotation.Component>
}
