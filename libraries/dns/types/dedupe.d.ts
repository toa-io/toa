declare namespace toa.dns {

  type dedupe = (urls: string[]) => Promise<string[]>

}

export type dedupe = toa.dns.dedupe
