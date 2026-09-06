# Resource discovery

Everything an application serves, at one path, and a page to read it with.

```http
OPTIONS /.discovery HTTP/1.1
accept: application/yaml
```

```http
200 OK
Allow: GET, HEAD, OPTIONS
cache-control: private, max-age=1800

routes:
  /pots:
    title: Pots
    GET:
      title: Every pot
      description: Every pot there is, newest first.
      output:
        type: array
        items:
          type: object
          properties:
            title: { type: string, maxLength: 64 }
    POST:
      input:
        type: object
        properties:
          title: { type: string, maxLength: 64 }
        required: [title]
      errors:
        - NO_WAY
  /pots/:id:
    protected: true
    GET:
      protected: true
      route:
        id: { title: Which pot }
```

`routes` is keyed by route template, and an object so that what is said of the whole tree has
somewhere to go. What a key maps to is what [`OPTIONS`](introspection.md) on that path
answers — what the resource is, from [`help:node`](help.md), beside every method of it — so a key
can be read from here and sent straight back as a request. A method this identity may not reach is
not in either, and a resource they may reach no method of is not here at all — so what a reader
sees is what they may call, and signing in is what adds to it.

A key carries no trailing slash, and a request needs one: `OPTIONS /pots/:id` and
`OPTIONS /pots/:id/` both answer, but `GET /pots/:id` is `404` and `GET /pots/:id/` is the call.
Append it.

Held for half an hour, and `private`: what is in it is what the identity that asked may reach.

## The page

`GET /.discovery/` is a page that reads the tree, served from the same origin the API is. It
answers before a credential is read, so it opens for a client whose token has expired — which is
the client most likely to be looking.

A method is called from it: the verb is a button, what the method takes is a form, and what came
back is shown where the form was. The call is made as whoever is reading — the same request they
would send themselves, and with the same effect.

A `GET /` whose `accept` prefers a page is sent here, so the address of the application opens it
in a browser. A route declared at `/` answers `/` as it always did; this is only what stands where
an application serves nothing there.

## What it is not

Neither is annotated, and both answer wherever a gateway does. What each entry says is what
`OPTIONS` on that path already says to the same caller, but the enumeration is not otherwise
available: an application that does not publish its routes to everyone refuses `/.discovery` at
the ingress.

## References

- [Introspection](introspection.md), which is what an entry is
- [Help](help.md), which is what names one
- [Features](../features/discovery.feature)
