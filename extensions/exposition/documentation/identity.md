# Identity

Identity is the fundamental entity within an authentication system that represents the **unique identifier** of an
individual, organization, application or device.

In order to prove its Identity, the request originator must provide a valid _credentials_ that are associated with that
Identity.

Identity is intrinsically linked to credentials, as an Identity is established only when the first set of credentials
for that Identity is created.
In other words, the creation of credentials marks the inception of an Identity.
Once the last credentials are removed from the Identity, it ceases to exist.
Without credentials, there is no basis for defining or asserting an Identity.

## Authentication

The Authenticaiton system resolves provided credentials to an Identity using one of the supported authentication
schemes.

The Authentication system is request-agnostic, meaning it does not depend on the specific URL being requested or the
content of the request body.
The only information it handles is the value of the `Authorization` header.

> Except for [its own resources](#persistent-credentials).

If the provided credentials are not valid or not associated with an identity, then Authentication interrupts request
processing and responds with an authentication error.

### Basic scheme

Classic ID/password pair authentication. See [RFC7617](https://datatracker.ietf.org/doc/html/rfc7617).

```http
Authorization: Basic aGVsbG86d29ybGQK
```

### Token scheme

Tokens issued by the Authentication system. These tokens are [PASETO](https://paseto.io).

The `Token` is the primary authentication scheme.
If request originators use an alternative authentication scheme, they will receive a response containing
`Token` credentials and will be required to switch to the `Token` scheme for any subsequent requests.
Continued use of other authentication schemes will result in temporary blocking of requests.

```http
Authrization: Token v4.local.eyJzdWIiOiJqb2hu...
```

### Bearer scheme

OpenID tokens issued by trusted providers.
For more information, refer to [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html),
[RFC6750](https://datatracker.ietf.org/doc/html/rfc6750).

Trusted providers are specified using the `idenity.trust` property within the Exposition annotation.

```yaml
# context.toa.yaml

exposition:
  identity:
    trust:
      - https://accounts.google.com
      - https://appleid.apple.com
```

The example above demonstrates the default list of trusted providers.

```http
Authorization: Bearer eyJhbGciOiJIUzI1...
```

### Persistent Credentials

`Basic` and `Bearer` credentials are persistent, so the Authentication system includes corresponding Components.

| Component           | Description                      |
|---------------------|----------------------------------|
| `identity.basic`    | Basic authentication credentials |
| `identity.subjects` | OpenID/OAuth token subjects      |

These Components expose a list of resources to manage credentials.

#### `/identity`

<dl>
<dt><code>POST</code></dt>
<dd>Create a new Identity with provided credentials.</dd>
<dt><code>GET</code></dt>
<dd>Resolve provided credentials to an Identity.</dd>
<dt><code>DELETE</code></dt>
<dd>Delete all credentials of an Identity.</dd>
</dl>

#### `/identity/basic/:id`

> `:id` placeholder refers to an Identity.

<dl>
<dt><code>PUT</code></dt>
<dd>Create or update Basic credentials. Request body is as follows:
</dd>
</dl>

```yaml
username?: string
password?: string
```

#### `/identity/subjects/:id`

<dl>
<dt><code>POST</code></dt>
<dd>Add <code>Bearer</code> token credentials to an Identity. Request body is as follows:<br/>
</dd>
</dl>

```yaml
token: string
```

<dl>
<dt><code>DELETE</code></dt>
<dd>Delete provided <code>Bearer</code> token credentials.
</dd>
</dl>

## FAQ

<dl>
<dt>How can I log in a user?</dt>
<dd>
Technically speaking, since the Authentication is request-agnostic, user credentials
can be sent with any request.

However, it is most likely that a request originator will need to obtain an Identity value for subsequent requests.
For this reason, it is recommended to make a `GET /identity` request.
</dd>
<dt>How can I log out a user?</dt>
<dd>Delete <code>Token</code> credentials from the device.</dd>
<dt>Where are the sessions?</dt>
<dd>
The Authentication is stateless, meaning it does not store any information between
requests except for persistent credentials.</dd>
<dt>How can I pass the Identity to an operation call?</dt>
<dd>
This is not possible. Refer to the Resource Design Guidelines for more information. 
<a href="https://github.com/toa-io/toa/issues/353">#353</a>
</dd>
</dl>
