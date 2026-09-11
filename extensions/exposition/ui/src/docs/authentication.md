# Authentication

Authentication is request-agnostic. It is not a resource: the caller is
identified from the `authorization` header of whichever request carries it.

## Transient credentials

Transient credentials are returned in the `authorization` response header in
exchange for persistent credentials, and on any authenticated request — that is
how a token is refreshed. The client **MUST NOT** store persistent credentials.

```http
GET /identity/
authorization: Basic ...
```

```http
200 OK
authorization: Token ...
cache-control: no-store
access-control-expose-headers: authorization
```

The client **MUST** discard the previous credentials and use the new ones for
all subsequent requests. The client **MAY** store the transient credentials in
a secure store.

## Sign-in

`GET /identity/` is the usual first request: it returns the identity those
credentials resolved to, and it is as good a place as any to receive the token.

## Sign-out

Delete the stored `Token`. There are no server-side sessions: the server is
stateless, as
[REST](https://roy.gbiv.com/pubs/dissertation/rest_arch_style.htm#sec_5_1_3)
has it.

<footer class="text-muted-foreground mt-12 text-sm">There are no cookies.</footer>
