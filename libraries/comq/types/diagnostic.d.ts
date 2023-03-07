declare namespace comq.diagnostics {

  type event = 'open' | 'close' | 'flow' | 'drain' | 'recover'

}

export type event = comq.diagnostics.event
