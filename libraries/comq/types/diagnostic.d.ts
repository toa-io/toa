declare namespace comq.diagnostics {

  type event = 'connect' | 'close' | 'flow' | 'drain'

}

export type event = comq.diagnostics.event
