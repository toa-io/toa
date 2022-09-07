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

    type Context = {
      local?: declaration.context.Calls
    }

  }

  type Declaration = {
    title?: string
    input: any
    output: any
    context?: declaration.Context
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
  }

  type Sample = {
    title?: string
    request: Request
    reply: Reply
    context?: Context
  }

  type Set = {
    [operation: string]: Sample[]
  }

  type Suite = {
    [component: string]: Set
  }

}

export type Declaration = toa.samples.Declaration
export type Sample = toa.samples.Sample
export type Suite = toa.samples.Suite
