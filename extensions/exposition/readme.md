# Toa Exposition

## TL;DR

Exposition is a converter from [ROA](https://en.wikipedia.org/wiki/Resource-oriented_architecture)
to [SOA](https://en.wikipedia.org/wiki/Service-oriented_architecture).

```yaml
# manifest.toa.yaml

name: dummy
namespace: dummies

exposition:
  /: [obeserve]
```

```yaml
# context.toa.yaml

exposition:
  host: api.example.com
```

```http
GET /dummies/dummy
Host: api.example.com
```

## Overview

<a href="https://miro.com/app/board/uXjVOoy0ImU=/?moveToWidget=3458764555658883997&cot=14">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="./.readme/overview-dark.jpg">
        <img alt="Exposition" width="800" height="427" src="./.readme/overview-light.jpg">
    </picture>
</a>

The Exposition extension includes a Service which is an HTTP server with ingress and a Tenant. The Service communicates
with Tenants to discover their resource declarations and exposes them as HTTP resources. An instance of the Tenant is
running within each Composition that has at least one Component with a resource declaration.

## Discovery

During the startup of the Tenant instance, it broadcasts an `expose` message containing the resource declarations
of the Components within the Composition. Upon receiving the `expose` message, instances of the Service (re-)configures
corresponding routes for its HTTP server.

During the startup of the Service instance, it broadcasts a `ping` message. Once an instance of the Tenant receives
a `ping` message, it broadcasts an `expose` message.

## Resource Tree Declaration

A Component can specify how to expose its Operations as HTTP resources by declaring *Routes* using the manifest
extension.

```yaml
# manifest.toa.yaml

extensions:
  '@toa.io/extensions.exposition': ...
```

Alternatively, a shortcut `exposition` is available:

```yaml
# manifest.toa.yaml

exposition: ...
```

The value of the `exposition` manifest is a Resource Tree Declaration object (RTD).
RTD consists of *Routes*, *Operations*, *Queries* and *Directives*.

### Routes

Route in the RTD is a key starting with `/` and having nested RTD as its value.

```yaml
# manifest.toa.yaml

name: rooms
namespace: chat

exposition:
  /:
    /:user-id:
      /:room-id: ...
```

Route declarations can also be flat, meaning that the RTD can have adjacent branches. The following is equivalent to the
above:

```yaml
# manifest.toa.yaml

name: rooms
namespace: chat

exposition:
  /: ...
  /:user-id: ...
  /:user-id/:room-id: ...
```

> Refer to the [Directives](#directives) section for an explanation of the differences between nested and adjacent RTD
> branches.

Any of the declarations above will be mapped by the Service to the corresponding HTTP server routes:

```
/chat/rooms/
/chat/rooms/:user-id/
/chat/rooms/:user-id/:room-id/
```

Component routes are prefixed with `/{namespace}/{name}` or `/{name}` for components within the default namespace.

### Operations

Operations are declared within the `operations` key of an RTD, which contains a set of the Component's Operation names
to be mapped to the corresponding route.

```yaml
# manifest.toa.yaml

exposition:
  /:
    operations: [observe, transit]
```

The `operations` key can be present in each RTD node. However, it is mandatory for the `operations` key to be present in
the RTD leaves[^1].

If the `operations` key is the only key in the RTD leaf, a concise declaration can be used. The following is equivalent
to the previous example:

```yaml
# manifest.toa.yaml

exposition:
  /: [observe, transit]
```

[^1]: *RTD leaf* refers to an RTD node without nested routes.

### Queries

Query object declared with `query` RTD key is used as the `Request.query` argument for corresponding operation calls.
RTD Query conforms [UI Query schema](#).

```yaml
# manifest.toa.yaml

name: pots
namespace: tea

exposition:
  /hot:
    operations: [observe]
    query:
      criteria: state==hot
    /top10:
      operations: [observe]
      query:
        criteria: state==hot
        sort: rank:desc
        limit: 10
```

#### Criteria

The criteria property is considered as *open* when it ends with a `;`, allowing the combination of request query
criteria using and logic. Otherwise, criteria property is *closed*, that is, doesn't allow `criteria` in a request
query.

```yaml
# manifest.toa.yaml

name: dummy

exposition:
  /:
    query:
      criteria: state==hot; # open criteria
```

```http
GET /dummies?criteria=rank==5
```

The request example above will result in an operation call with the request:

```yaml
query:
  criteria: state==hot;rank=5
```

See [Request Mapping](#requests-mapping) for details.

#### Omit, limit

`omit` and `limit` properties can declare their default values and allowed boundaries:

```yaml
limit:
  value: 10
  range: [1, 100]
```

If `range` is not specified, then the `value` is constat.
If no `value` is specified, then the lower boundary is considered the default value.
Both of these cases have consice shortcuts:

```yaml
omit: 10
limit: [10, 100]
```

#### Sort

The `sort` query property defines the result order of the observation with an `objects` scope (enumeration). It contains
an ordered set of sorting statements delimited by a comma. Each statement consists of an entity property name with an
optional sorting direction suffix (`:asc` or `:desc`).

```yaml
sort: 'rank' # ascending by default
```

```yaml
sort: 'rank:asc'
```

```yaml
sort: 'rank:desc,timestamp:asc'
```

#### Projection

A list of Entity properties to be included in the observation result, delimited by a comma.

```yaml
projection: id,title,timestamp
```

### Directives

## Requests Mapping

## Context Annotation
