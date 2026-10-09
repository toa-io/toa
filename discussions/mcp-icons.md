# The icons of an MCP server

## Design concept

An application names its web manifest in the MCP annotation, and the server shows itself by the
icons that manifest lists. A client that renders a server's icons renders the application's own,
rather than whatever it finds for the domain.

### Guarantees

**What a client is shown**

1. With `mcp.manifest` named, `serverInfo` carries `icons` — of `initialize`, and as
   `_meta['io.modelcontextprotocol/serverInfo']` of `server/discover` and of every modern result.
2. An icon is the manifest's: its `src` resolved against the manifest's URL, its `type` as
   `mimeType`, its `sizes` split on whitespace. A manifest says nothing of a theme, so no icon names
   one.
3. Only an icon a client may render with no further trust is shown: one served from the manifest's
   own origin, with no `purpose` or one that includes `any`, and a `type` of an image where it
   states one. A size other than `WxH` or `any` is left out of the icon.
4. Without `mcp.manifest`, `serverInfo` is what it is _(today)_.
5. `name`, `version`, `instructions` and the tools do not change: the manifest gives icons and
   nothing else.

**Reading**

6. The manifest is read when the gateway starts and every half hour after, the time a client may
   hold `server/discover`; a change to its icons is shown within that time twice over.
7. Until a read succeeds, the endpoint answers without icons, and reading is retried sooner.
8. A read that fails leaves the icons of the last one that did not.
9. A request is never made to wait for a read, and no failure to read is a failure of the endpoint.

**What is trusted**

10. Nothing is fetched unless a manifest is named. Its URL is `https`, or `http` on a loopback
    host, as an issuer's is.
11. A manifest is read without following a redirect, within a timeout, and no more than 16 KiB of
    it.

**What is not promised**

12. `title`, `description` and `websiteUrl` are not taken from the manifest: what an application's
    manifest calls it is not necessarily what its server should be called.
13. HTTP caching of the manifest is not honoured; the half-hour cycle replaces it.

### What a component author does differently

```yaml
# context.toa.yaml

exposition:
  mcp:
    name: Teapots
    manifest: https://teapots.example/manifest.json
```

```json
{
  "name": "Teapots",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/mask.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

```yaml
# initialize
serverInfo:
  name: Teapots
  version: 1.0.0-alpha.324
  icons:
    - src: https://teapots.example/icon-192.png
      mimeType: image/png
      sizes: [192x192]
    - src: https://teapots.example/icon-512.png
      mimeType: image/png
      sizes: [512x512]
```

## The changes, by area

1. **`@toa.io/definitions`.** `mcp.manifest` in the annotation type and its schema.
2. **The MCP server.** A manifest reader, a connector the gateway depends on: it reads at `open`,
   schedules the next read, and stops at `close`. What it read is the input of the server's
   discovery, built again when the icons change.
3. **Documentation.** `documentation/mcp.md` on `manifest`, and on what `serverInfo` carries.

## Decisions

**A manifest rather than icons in the annotation.** An application that has a web manifest has
already said what its icons are, at what sizes and in which formats, and changes them where it
changes its site. Declaring them again in the annotation is a second place to keep up to date,
and one that needs a deploy to change.

**Read by the gateway, in the background.** A request must not wait for a document of another
origin, so the read is not made on a request; a component holding it in a stash would be shared
state for a document every replica can read itself.

**Only the manifest's origin.** A client is asked to trust the icons a server names; an icon of
another origin is one the application did not serve, and a manifest is the application's only
where its icons are.

**Failure keeps the last good read.** A site briefly unavailable should not take icons off every
client that discovers the server meanwhile.

## What happens today

`serverInfo` is `{ name, version }`. A client that renders a server's icon looks for one of its own
— typically the favicon of the server's domain or of its parent — and what it finds may be
neither current nor the application's.

## Verification

`extensions/exposition/features/mcp.manifest.feature`:

1. With a manifest named, `initialize` carries its icons in `serverInfo`, resolved and mapped.
2. `server/discover` carries the same in `_meta['io.modelcontextprotocol/serverInfo']`.
3. A `maskable` icon, an icon of another origin and a non-image `type` are not shown.
4. A manifest nothing answers at leaves `serverInfo` as it is without one, and the endpoint answers.

The schedule — not awaited, retried until it succeeds, kept on failure, read again every half hour
— is a unit test of the reader with a fake clock.

## Compatibility

`mcp.manifest` is additive: a context that does not write it is served as it is. `icons` is an
optional field of `Implementation` in both revisions served.

## References

- [MCP `Implementation` and `Icon`](https://modelcontextprotocol.io/specification/2025-11-25/schema)
- [Web Application Manifest, `icons`](https://www.w3.org/TR/appmanifest/#icons-member)
