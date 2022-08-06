declare namespace toa.node.operations {

  interface Response<Output> {
    output?: Output
    error?: Object
  }

  interface Algorithm<Input, Entity, Output> {
    execute(input?: Input, subject?: Entity | Entity[]): Response<Output> | Object
  }

  interface Factory<Input, Entity, Output> {
    create(): Algorithm<Input, Entity, Output>
  }

}
