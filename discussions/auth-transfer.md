# A route that takes a credential not its own

## Design concept

A route can be called by a service that authenticates as itself, with a credential the gateway
neither issued nor federates — a push of a message broker signed by its cloud, a webhook signed
by its sender. `auth:transfer` names the property of the input the `authorization` header is given
to, and grants access: the operation verifies the credential, and the gateway does not read it.

### Guarantees

1. A method that declares `auth:transfer: <property>` is called with the value of the
   `authorization` header as `<property>` of its input, as the request sent it.
2. The gateway does not authenticate that header: no identity provider is asked, no failed
   authentication is counted against the address, nothing is logged of it, and a scheme the
   gateway knows nothing of is taken. The call has no identity.
3. A request without the header is admitted too, and the property is absent: whether that is
   refused is the input's schema to say.
4. A reply of the method is never stored: `cache-control: no-store`.
5. A procedure (`/.rpc`, `/.mcp`) does not reach the method: the credential of a procedure is the
   caller's own, which is not the method's to read.
6. On a method that declares `auth:transfer`, no other directive of `auth` is asked, its own or
   one it inherits.

**What is not promised**

7. That the credential is valid. The operation verifies it.

### What a component author does differently

```yaml
exposition:
  /:
    POST:
      auth:transfer: authorization
      endpoint: ingest
```

```javascript
export async function transition(input) {
  const token = input.authorization // 'Bearer eyJ…', or undefined
}
```

## The changes, by area

1. `extensions/exposition`: the gateway matches the route of a plain request that carries a
   credential before it authenticates it, and gives the matched method's directives to the
   request-scoped stage of each family; `auth` leaves a credential unread where the method
   transfers it. `auth:transfer` embeds the header into the body and grants access; it refuses a
   procedure, makes the reply `no-store`, and is the only directive of `auth` its method keeps.
2. `documentation/access.md`: the directive.

## Decisions

1. **Matched before, not authenticated lazily.** Authenticating on the first call that needs an
   identity would move a step every family reads from — `cache`, `io`, MCP — for one directive.
   The route a plain request names is known before anything else is done with it, and the match
   is the one the request is served by: it is made once.
2. **The header whole.** The scheme is the operation's to read with the credential: one it does
   not expect is the operation's to refuse.
3. **Alone, over what is inherited.** A method that grants access to whoever calls it, with no
   identity, has nothing for another directive of `auth` to decide — and what is asked after a
   refusal of it could admit what it refuses: a procedure, under an `anonymous` inherited from a
   parent. Refusing to start where another is declared was weighed and refused: a directive of a
   parent node or of the Context reaches every method under it, so the method could never be
   declared under one.

## Compatibility

A request whose route declares no `auth:transfer` is authenticated as before.
