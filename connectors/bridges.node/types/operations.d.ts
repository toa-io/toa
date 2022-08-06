declare namespace toa.node.operations {

  interface Response {
    output?: Object
    error?: Object
  }

  interface Operation {
    execute: (input?: Object, subject?: Object | Object[]) => Response | Object
  }

}
