# Help

What a resource and its methods are, in the words an application chooses for them. One
declaration, read by everything that describes a resource: [`OPTIONS`](introspection.md),
[discovery](discovery.md), and the tools [MCP](mcp.md) publishes.

```yaml
/pots:
  help:node: Pots
  GET:
    help:method: Every pot
    help:query:
      criteria:
        title: What to match
        description: An RSQL expression over a pot's fields.
    endpoint: enumerate
  /:id:
    GET:
      help:method:
        title: One pot
        description: The pot by its id, and what is in it.
      help:route:
        id: Which pot
      endpoint: observe
```

<dl>
<dt><code>help:node</code></dt>
<dd>What the resource is.</dd>
<dt><code>help:method</code></dt>
<dd>What one of its methods is.</dd>
<dt><code>help:route</code></dt>
<dd>What a route variable is, by the name the template gives it.</dd>
<dt><code>help:query</code></dt>
<dd>What a querystring parameter is, by name.</dd>
</dl>

All four take the same value. A bare one is the <code>title</code> — the short thing, and what a
client has somewhere to put. A sentence is written as a <code>description</code> beside it, and
either may stand alone. The parameters name each one they describe.

`help:method: null` hides the method instead of naming it: it is in no answer — not `OPTIONS`,
not the [tree](discovery.md), not the tools [MCP](mcp.md) publishes — and is reached exactly as
it was. What a monitor calls, and what a person has no business going looking for, is declared
this way. A resource whose every method is hidden answers `403` to `OPTIONS` and is not in the
tree at all.

```yaml
/hello/agent:
  GET:
    help:method: null
    endpoint: agent
```

A title is not a name. A name is an address — `apps._identity._id.repos.POST` — and reads as one;
this is what a person is shown instead.

An operation [states what it is](/documentation/component/declaration.md) as well, and that is not
this: it is written without knowledge of any route, and a method is an operation and a route
together. The same operation mounted twice is two methods, and one sentence is not true of both.
The operation's own is the Introspection's to read, and the gateway does not use it.

## Where it is answered

`help:node` is answered beside the methods, and `help:method` inside the method it is on. A verb
is upper case, so neither key can be mistaken for the other. A parameter's goes in its schema,
which is where a schema says these anyway:

```yaml
title: Pots
GET:
  title: Every pot
  query:
    criteria:
      type: string
      title: What to match
      description: An RSQL expression over a pot's fields.
```

Describe a parameter by the name the answer carries it under. `map:segments` answers a variable
under the property it fills, so that is its name here and the template's is nowhere in the answer.

A route variable the template names is answered whether or not the operation declares it — an `:id`
an observation takes through the query is otherwise not in the answer at all, and describing it is
what puts it there. Anything else is described only where it is already answered. A name that is
nobody's is not answered, and nothing here checks one: the template does not say them all.

`help:query` describes the [parameters a resource declares](query.md#parameters). What selects
records — `criteria`, `sort` and the rest — is answered as [`selection`](introspection.md)
on the method, and is not described here.

## Where it applies

To the node it is written on, and to nothing under it. Every other directive applies downward;
carried down, this one would say of every resource below that it is the one it was written for.

```yaml
/pots:
  help:node: Pots      # `/pots`, and not `/pots/:id`
  GET: enumerate
  /:id:
    GET: observe
```

A node whose `/` answers in its place is the exception, because the two are one resource:

```yaml
/pots:
  help:node: Pots      # `/pots/` is what answers, and it is described
  /:
    GET: enumerate
```

A resource is described beside what it serves, so a node that serves nothing cannot be described.
Declaring it there is refused where it is written, rather than found missing from the answer.

## References

- [Resource introspection](introspection.md), which is where a method's own is answered
- [Resource discovery](discovery.md), which answers every resource at once
- [MCP](mcp.md), where a published method is a tool called this
- [Features](../features/help.feature)
