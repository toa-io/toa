# Query mapping

## TL;DR

```yaml
id?: string
criteria?: string
sort?: string
omit?: integer
limit?: integer
token?: string
selectors?: string[]
projection?: string[]
```

```yaml
# manifest.toa.yaml

name: pots
namespace: tea

exposition:
  /hot:
    GET:
      endpoint: enumerate
      query:
        criteria: state==hot
    /top10:
      GET:
        endpoint: enumerate
        query:
          criteria: state==hot
          sort: rank:desc
          text: true
          limit: 10
  /latest:
    GET:
      endpoint: observe
      query:
        sort: timestamp:desc
        limit: 1
```

Undefined `query` denies any query arguments in requests.

`POST` method mapping cannot have `query` declaration.

## Criteria

Search criteria in [RSQL](https://github.com/jirutka/rsql-parser) format.

| operator                                          | takes                             |
| ------------------------------------------------- | --------------------------------- |
| `==` `!=`                                         | one value                         |
| `<` `<=` `>` `>=`, or `=lt=` `=le=` `=gt=` `=ge=` | one value                         |
| `=in=` `=out=`                                    | a list: `state=in=(hot,cold)`     |
| `;` or `and`, `,` or `or`                         | two criteria, `;` binding tighter |

Parentheses group. A value with whitespace or any of `"'();,=!~<>` in it is quoted, and a quote
inside it is escaped with a backslash: `title=="hot \"tea\""`. Criteria that cannot be read are
refused with `400 Bad Request`.

A value is read as what the property it selects on holds, and one that cannot be read as that is
refused with `400 Bad Request` — `volume>abc` where `volume` is a number, or `booked==yes` where
`booked` is a boolean. A string property takes whatever is written.

An unquoted `null` or `undefined` is no value, whatever the property: `rank==null` selects what
holds no `rank` — never set, or set to `null` — and `rank!=null` what holds one. It is compared
with `==`, `!=`, `=in=` and `=out=`, and refused with `400 Bad Request` by any other operator. A
quoted one is text: `title=="null"`.

The `criteria` property is considered as _open_ when it ends with a `;`, allowing the combination of
request query criteria using `and` logic.
Otherwise, criteria property is _closed_, that is, doesn't allow `criteria` in a request query.

```yaml
# manifest.toa.yaml

name: dummy

exposition:
  /:
    GET:
      endpoint: observe
      query:
        criteria: state==hot; # open criteria
```

```http
GET /dummies/?criteria=rank==5
```

The request example above will result in an operation call with the following Request:

```yaml
query:
  criteria: state==hot;rank=5
```

### Path variables

Path variables are prepended to the `criteria` request query parameter except for
the [`POST` method](#post-method).

If query criteria starts with logical operator (`,` or `;`), then path variables are prepended
accordingly.
`AND` logical operator is used by default.

Given the following declaration:

```yaml
# manifest.toa.yaml

name: dummies

exposition:
  /:type:
    GET:
      endpoint: observe
      query:
        criteria: ,state==hot; # open criteria
```

and the following request:

```http request
GET /dummies/cool/?criteria=rank==5
```

Operation call will have the following query criteria:

```yaml
criteria: (type==cool,state==hot);(rank=5)
```

#### POST method

`POST` method semantically used to create a new entity instance, that is, calling a Transition
without Query.
Thus, path variables are added to the request input.

Given the following declaration:

```yaml
# manifest.toa.yaml

name: dummies

exposition:
  /:type:
    POST: transit
```

and the following request:

```http request
POST /dummies/cool/
content-type: application/yaml

input:
  rank: 5
```

Operation call will have the following input:

```yaml
type: cool
rank: 5
```

> In case of conflict, path variables override input properties.

## Text search

For entities with `text` indexes — declared in a
[migration](/documentation/component/declaration.md#migrations) — search queries can be enabled
using the `search` property.

```yaml
# manifest.toa.yaml

name: dummies

exposition:
  /:type:
    GET:
      endpoint: observe
      query:
        search: true
```

```yaml
GET /dummies/?search=some+text+query
```

## Omit, limit

`omit` and `limit` properties can declare their default values and allowed boundaries:

```yaml
limit:
  value: 10
  range: [1, 100]
```

If no default value is provided, then the lower boundary of the range is used.

Default values for `omit` and `limit` are:

```yaml
omit:
  value: 0
  range: [0, 1000]
limit:
  value: 10
  range: [1, 1000]
```

Constant values can be declared using the shortcut:

```yaml
limit: 10
```

```http
GET /dummies/?omit=100&limit=10
```

A route to an operation of scope `stream` takes `limit` as the size of a window, and refuses `omit`:
the next window is read with the [token](#token) the window ends with. A stream route that declares no
`limit` answers the whole collection in one reply.

## Sort

The `sort` query property defines the result order of Observations within an `entries` scope
(enumeration).
It comprises an ordered set of sorting statements delimited by semicolons.
Each statement consists of an entity property name with an optional sorting direction suffix:
`:asc`for ascending or `:desc` for descending.

```yaml
sort: rank # ascending by default
```

```yaml
sort: rank:asc
```

```yaml
sort: rank:desc;timestamp:asc
```

If `sort` value ends with a semicolon `;` then the sorting is considered _open_
and can be extended using request query `sort` argument.

```yaml
sort: rank:desc; # open sort
```

Having the above `sort` declaration, the following request will result in an operation call
with `rank:desc;timestamp:asc` sort:

```http
GET /dummies/?sort=timestamp:asc
```

A stream route takes `sort` beside `limit` or `token` by `id` and `CREATED` alone, what an entry
never changes: windows come ordered by it, and changes in the order they happened.

## Token

A stream ends with a token, and a request that carries it is answered what is left to read: the
rest of the collection while it is being read a window at a time, and what changed in it since, once it has
been read. See [streaming a collection](/documentation/collections.md).

```http
GET /todos/?limit=100
GET /todos/?token=eyJ2IjoxLCJwIjoi...&limit=100
```

`stop` ends the read after its first window: its token continues with what changed, and nothing
deeper is read.

```http
GET /todos/?sort=CREATED:desc&stop
```

A token the storage cannot continue from is answered `410 Gone`, and the client reads the collection again
without one. A token presented under criteria or an order other than its own is answered `400`.

## Selectors

![Not implemented](https://img.shields.io/badge/Not_implemented-red)

The `selectors` query property contains a list of Entity properties allowed for a client to use in
the `criteria` and `sort` query parameters.
If no value is provided, then no selectors are allowed.

```yaml
selectors: [rank, timestamp]
```

## Projection

A list of Entity properties an Observation reads. Its algorithm receives those, `id` and the
system properties, and nothing else. A Method that declares no projection reads the whole Entity.

```yaml
projection: [title, timestamp]
```

`id` is always read, and a projection that names it is refused.

Only a Method mapped to an Observation declares a projection: an operation of any other type
answers a request whose query carries one with an exception, and a composition whose Method
declares one for such an operation does not start.

What a client receives of the result is what [`io:output`](./io.md) admits, whatever the
projection reads.

## Parameters

By default, the only query parameters allowed are described above. Arbitrary query parameters
can be allowed by specifying them in the `parameters` property.

```yaml
parameters: [foo, bar]
```

These parameters are embedded in the operation call input, which must be an object.

```http
GET /dummies/?foo=0&bar=baz
```

## Optimistic concurrency control

Client can use the `if-match` request header to perform an operation only if the corresponding
object has not been modified since the last retrieval. What it sends is the `VERSION` the object
was read with, so a Method whose clients use it lists `VERSION` in
its [`io:output`](io.md#output).

The [`etag`](cache.md#validators) of a reply is a hash of the body it carries, not the version,
and a request that sends it in `if-match` is answered `400 Bad Request`.

```http
GET /dummies/5e82ed5e/ HTTP/1.1

---

HTTP/1.1 200 OK

foo: bar
VERSION: 1
```

```http request
PUT /dummies/5e82ed5e/ HTTP/1.1
if-match: "1"

foo: baz
```

```http
200 OK
```

```http request
PUT /dummies/5e82ed5e/ HTTP/1.1
if-match: "never"

foo: baz
```

```http
412 Precondition Failed
```

The value within the quotes is mapped to the `version` property of operation call query.
