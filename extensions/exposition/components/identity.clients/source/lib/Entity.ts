export interface Entity {
  id: string
  authority: string
  name?: string
  uris: string[]
  uri?: string
  logo?: string
  scope?: string
  expires?: number
  _created?: number
}

/** What a client says about itself, in the shape both mechanisms carry it. */
export interface Metadata {
  client_name?: string
  client_uri?: string
  logo_uri?: string
  redirect_uris: string[]
  scope?: string
  token_endpoint_auth_method?: string
}

/** A client, however it came to be known. */
export interface Client {
  client_id: string
  client_name?: string
  client_uri?: string
  logo_uri?: string
  redirect_uris: string[]
  issued?: number
}
