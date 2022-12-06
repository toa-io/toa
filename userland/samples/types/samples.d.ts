declare namespace toa.samples {

  namespace declaration {

    namespace context {

      type Call = {
        input?: any
        output?: any
      }

      type Calls = {
        [key: string]: Call | Call[]
      }

    }

  }

  type Events = {
    [key: string]: Object
  }

  type Extension = [{
    arguments?: any[]
    result?: any
    permanent?: boolean
  }]

  type Extensions = {
    [key: string]: Extension
  }

  type Declaration = {
    title?: string
    input?: any
    output?: any
    local?: declaration.context.Calls
    remote?: declaration.context.Calls
    current?: Object | Object[]
    next?: Object
    events?: Events
    extensions?: Extensions

    [key: string]: any
  }

  type Request = {
    input: any
  }

  type Reply = {
    output: any
  }

  type Call = {
    title?: any
    request: Request
    reply?: Reply
  }


  namespace context {

    type Calls = {
      [key: string]: Call[]
    }

  }

  type Context = {
    local?: context.Calls
    remote?: context.Calls
  }

  type Storage = {
    current?: Object | Object[]
    next?: Object
  }

  type Sample = {
    autonomous?: boolean
    title?: string
    request: Request
    reply: Reply
    context?: Context
    storage?: Storage
    events?: Events
    extensions?: Extensions
  }

  type Set = {
    [operation: string]: Sample[]
  }

  type Sets = {
    [component: string]: Set
  }

  type Suite = {
    autonomous: boolean
  } & Sets

}

export type Declaration = toa.samples.Declaration
export type Sample = toa.samples.Sample
export type Suite = toa.samples.Suite
