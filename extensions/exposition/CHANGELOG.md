# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.285](https://github.com/toa-io/toa/compare/v1.0.0-alpha.284...v1.0.0-alpha.285) (2026-09-05)

### Bug Fixes

* **exposition:** a procedure is named in characters a tool's name may hold ([857ff75](https://github.com/toa-io/toa/commit/857ff75858e633682d5c245eccde3dc00797ec00))

### Features

* **exposition:** a tool says what to call it, beside what it is ([c94dcd1](https://github.com/toa-io/toa/commit/c94dcd10ab5a2875975fdba94b37dae128f454c4))


# [1.0.0-alpha.284](https://github.com/toa-io/toa/compare/v1.0.0-alpha.283...v1.0.0-alpha.284) (2026-09-05)

### Bug Fixes

* **build:** an operations directory holds modules and nothing else ([21a8ca1](https://github.com/toa-io/toa/commit/21a8ca19f1c45aef6cbb443ada0a909d325e76e8))
* **exposition:** a complete result says how long it may be held ([484613d](https://github.com/toa-io/toa/commit/484613d6fa8b42ad457773d9b3f536513c521853))
* **exposition:** a Principal holds its Role in the Token that creates it ([250907f](https://github.com/toa-io/toa/commit/250907f091cc7b10e8d5ff9ad8f6893a6334174f))
* **exposition:** a route parameter is what it means, not how it was spelled ([86bdbdc](https://github.com/toa-io/toa/commit/86bdbdc81f5a707c71876177ae0f33847c9a8b72))
* **exposition:** a tool says what its query does, not what carries it ([75470ac](https://github.com/toa-io/toa/commit/75470acde4cea101d7dbc14396a455fc6e5f3fde))
* **exposition:** an issuer is named over https ([3e2e090](https://github.com/toa-io/toa/commit/3e2e09046170a2235ea7ba7f26e8606b23e404f9))
* **exposition:** what a directive fills from the identity is not the caller's to send ([c7f1658](https://github.com/toa-io/toa/commit/c7f16580a59aa73903a5ff5e11ac1322f94fd877))
* **exposition:** what a tool call was refused for is the model's to correct ([030750c](https://github.com/toa-io/toa/commit/030750caec46ef888260704f9df1b201a661fffd))
* **exposition:** what an operation states it is, is not what a method is ([82194f0](https://github.com/toa-io/toa/commit/82194f0dcd68e3699440abf7d0a8976749cee723))
* run the feature suites on a fresh checkout ([712a03d](https://github.com/toa-io/toa/commit/712a03d37cca40709e919f9cc996a3d67bea2098))

### Features

* an operation states what it is ([b5e2f66](https://github.com/toa-io/toa/commit/b5e2f66c8bf67924e2eaaaa11f283dfb4d810981))
* **exposition:** a method describes itself through its directives ([a0cb486](https://github.com/toa-io/toa/commit/a0cb48651b5893b5504e0c2f74dac260d23e899f))
* **exposition:** a method is a tool where it says so ([4948ca1](https://github.com/toa-io/toa/commit/4948ca1248b726800fae305b5b8c2b4016f197af))
* **exposition:** a procedure is named in what a model can call ([4a34db7](https://github.com/toa-io/toa/commit/4a34db7fea1fc002c4f47a94d7410224e9afb17f))
* **exposition:** a request may carry several calls ([d277207](https://github.com/toa-io/toa/commit/d27720758ef75874b32a09c207e2036a72f65a88))
* **exposition:** a resource answers as a procedure ([9f231b7](https://github.com/toa-io/toa/commit/9f231b78b1713ecd3bcdf5f8b531f232d610e6fe))
* **exposition:** every method is a tool, and a procedure is not a request ([06b6759](https://github.com/toa-io/toa/commit/06b675929318826ef714989dc97c63b0ab85bbef))
* **exposition:** the gateway says which endpoints it serves ([1a0029b](https://github.com/toa-io/toa/commit/1a0029bc2df3d759dbe2bbee6ffdf9b2a00c411f))
* **exposition:** the Model Context Protocol ([a31b2e1](https://github.com/toa-io/toa/commit/a31b2e146e7c20372f72a7f176946ed16e269266))
* **exposition:** what a tool is, is the value that publishes it ([8e77119](https://github.com/toa-io/toa/commit/8e771192cefcb11d0c78ac1cf87d3120f74ce868))


# [1.0.0-alpha.283](https://github.com/toa-io/toa/compare/v1.0.0-alpha.282...v1.0.0-alpha.283) (2026-09-04)

### Bug Fixes

* **cli:** an assignment hands back the new state, not nothing ([91304e9](https://github.com/toa-io/toa/commit/91304e9e9a3bba5933b7421b7a0ffff0c2e47795))
* **exposition:** declare error codes as the operations return them ([a9007c0](https://github.com/toa-io/toa/commit/a9007c0dd1b199429af50fb57441281bb19ff971))
* **exposition:** declare the errors the built-in components return ([27200c3](https://github.com/toa-io/toa/commit/27200c348ab09068d58c52c3e83208cb29cd7290))
* **exposition:** look up an authority by a key an object does not answer ([cea57f5](https://github.com/toa-io/toa/commit/cea57f5010530b13fd20becfc69f2b243da95544))
* **exposition:** read the configured token lifetime in seconds ([60486c6](https://github.com/toa-io/toa/commit/60486c6c2d2ba97caa9d01ab755351c99a156806))
* **exposition:** reject a malformed Bearer rather than failing on it ([2b1a46d](https://github.com/toa-io/toa/commit/2b1a46d5b3d2abb64703b10b1543749baeac7596))
* **storages:** take `Maybe` from core, not from the deprecated package ([bcaeeb3](https://github.com/toa-io/toa/commit/bcaeeb3c76c89af34e94ff569a210d21b7e87f64))

### Features

* **cli:** a type module is declarations, so it sits beside a component's source ([ca755d9](https://github.com/toa-io/toa/commit/ca755d93d1a04b7697dd0dd12eb59e5b6e2a71d1))
* **cli:** generate an application's types from its manifests ([195ac94](https://github.com/toa-io/toa/commit/195ac94de0d8c9de995847599511782c399768a5))
* **cli:** the built-in components ship types generated from their manifests ([bd7db9e](https://github.com/toa-io/toa/commit/bd7db9e88e46c1060223761898932239127f389a))
* **exposition:** grant a client what a user allowed it ([95ef0cf](https://github.com/toa-io/toa/commit/95ef0cf6bcbb43580710ff9ce3e1d9e33c0f4963))
* **exposition:** know what an OAuth client is ([5e101c8](https://github.com/toa-io/toa/commit/5e101c865f4bb75c01e7b5c637bfcd41f84c17e4))
* **exposition:** let an operation state the status of its reply ([427864d](https://github.com/toa-io/toa/commit/427864d88f1c33a762b4b0f33489ad17eb7fb470))
* **exposition:** let several providers claim one authentication scheme ([514177b](https://github.com/toa-io/toa/commit/514177b546fbd9fafe35c178cb38774f3e2f862a))
* **exposition:** read a request sent as a form ([02fac86](https://github.com/toa-io/toa/commit/02fac86af392525fa374f16f51f1b3b07365b042))
* **exposition:** serve OAuth discovery and challenge with it ([418890c](https://github.com/toa-io/toa/commit/418890cb30eb1dd041073a75f971b5820ae40a95))
* **exposition:** set an exact cache-control whatever the method ([22f939a](https://github.com/toa-io/toa/commit/22f939a7a855d5ae2cfebb517caec98b8ca95de0))
* **extensions:** an extension declares what it puts on a component's context ([133bc2a](https://github.com/toa-io/toa/commit/133bc2aad1e45a2d4aa68a08a5e44ca48d3b7414))


# [1.0.0-alpha.282](https://github.com/toa-io/toa/compare/v1.0.0-alpha.281...v1.0.0-alpha.282) (2026-09-03)

### Bug Fixes

* **exposition:** bouncer requires ip ([d470494](https://github.com/toa-io/toa/commit/d470494fdb42372a434d945205e93e27bca8880b))
* **exposition:** bound OTP guessing ([44b5a6a](https://github.com/toa-io/toa/commit/44b5a6a1f743cca4bd80b0b7e9f9691af83fb2ab))
* **exposition:** do not delegate the right to delegate ([cf1f83f](https://github.com/toa-io/toa/commit/cf1f83f6bb1051b8b399c632bb81f08a2fd9fb14))
* **exposition:** keep credentials out of the logs ([17a5529](https://github.com/toa-io/toa/commit/17a55296ec530b6f3c3a1d4e746499e52ef1c126))
* **exposition:** leave custom tokens unrefreshed ([ebec3d5](https://github.com/toa-io/toa/commit/ebec3d5ea421e8c780f7c7afd781c588851ef8fa))
* **exposition:** match token permissions on the routed path ([6c888f5](https://github.com/toa-io/toa/commit/6c888f5e51a379c0cdf46e8e3b3b0fa406328de6))
* **exposition:** name the client address header in the authentication annotation ([433ca3a](https://github.com/toa-io/toa/commit/433ca3ae19bc2c68fa26f6205e559ea7e652fcb9))
* **exposition:** never key on the connection address ([ad719af](https://github.com/toa-io/toa/commit/ad719afb89455a9cbdb97f144928b233aababb73))
* **exposition:** quote criteria values built from requests ([af3bf79](https://github.com/toa-io/toa/commit/af3bf794d8668a45a4390ad16ffa04aa4fe078e8))
* **exposition:** read roles again when a token is refreshed ([96c59ca](https://github.com/toa-io/toa/commit/96c59cae39a1b023e6b2b05720ea0682d4c746ad))
* **exposition:** read the client address from a header the deployment names ([216c2d8](https://github.com/toa-io/toa/commit/216c2d8f21bdb67c7d4387708c80f806f1c72360))
* **exposition:** refuse rejected credentials before inception ([48e76a8](https://github.com/toa-io/toa/commit/48e76a8f421b95492d256b5c7a9ca61f71f0d7fd))
* **exposition:** require the audience of a trusted issuer ([0d13604](https://github.com/toa-io/toa/commit/0d13604e3707ed2fcac01500beb27d992314c549))
* **exposition:** resolve an authentication scheme by its own name only ([ae116d1](https://github.com/toa-io/toa/commit/ae116d1813fc1e5a42b5263daedb752703eb08f0))
* **exposition:** resolve the client address once, into the request context ([2f36347](https://github.com/toa-io/toa/commit/2f36347d948bab0c421ff63105312549fffc660a))
* **exposition:** revoke custom tokens through their keys ([359d882](https://github.com/toa-io/toa/commit/359d8825315fce010ea8ac3700d2778b48362f72))
* **exposition:** revoke custom tokens when a role is revoked ([191a0c6](https://github.com/toa-io/toa/commit/191a0c603ef53dcab5ccd005dd7296d9c9bfaa0b))
* **exposition:** scope the principal to an authority ([98a0d36](https://github.com/toa-io/toa/commit/98a0d36267523eb1a1aa58742744cd39a21e94e9))
* **exposition:** split Basic credentials at the first colon ([596e5dc](https://github.com/toa-io/toa/commit/596e5dc2e6e589007dc7914374e1592ecc71c997))
* **exposition:** validate the request authority ([68686c9](https://github.com/toa-io/toa/commit/68686c9340effb148532607caa1abbaaa5dc0519))

### Features

* **core:** a Host for extensions ([6315eac](https://github.com/toa-io/toa/commit/6315eac1e9fb05be472272de06385c54ad5934ce))
* **exposition:** meter failed authentications per address ([98b07d3](https://github.com/toa-io/toa/commit/98b07d307815ee4a2a0f30f189cbcfc9d78a4d62))


# [1.0.0-alpha.278](https://github.com/toa-io/toa/compare/v1.0.0-alpha.277...v1.0.0-alpha.278) (2026-09-03)

**Note:** Version bump only for package @toa.io/extensions.exposition





# [1.0.0-alpha.277](https://github.com/toa-io/toa/compare/v1.0.0-alpha.276...v1.0.0-alpha.277) (2026-09-03)

### Bug Fixes

* drop the build output that landed beside the sources ([a724f69](https://github.com/toa-io/toa/commit/a724f6921190e5c9d945e33c6035bb12d832e5c8))
* read a manifest the way js-yaml read one before ([fcea1b2](https://github.com/toa-io/toa/commit/fcea1b21996d6efa6c3198acbfc9f70f1ce0c35c))
* settle what the module loader made asynchronous ([d4ab9df](https://github.com/toa-io/toa/commit/d4ab9dfb09e382da311dba08f52214e7645f4a6c))


# [1.0.0-alpha.276](https://github.com/toa-io/toa/compare/v1.0.0-alpha.275...v1.0.0-alpha.276) (2026-09-03)


### Bug Fixes

* **exposition:** give a component `host` over HTTP/2 ([7635142](https://github.com/toa-io/toa/commit/7635142fccdd3a755b76c6b2de670bfee6da2d19))
* **exposition:** move the readiness probe off the Telemetry port ([4be9385](https://github.com/toa-io/toa/commit/4be93850f7eec65ded03a0a3ba3090003e40cb5c))





# [1.0.0-alpha.274](https://github.com/toa-io/toa/compare/v1.0.0-alpha.273...v1.0.0-alpha.274) (2026-09-02)


* Configuration is served by a component, followed live, and kept per epoch (#1017) ([b05997d](https://github.com/toa-io/toa/commit/b05997d3adb784f238a222cb46878b23859339a2)), closes [#1017](https://github.com/toa-io/toa/issues/1017)


### BREAKING CHANGES

* a secret configuration value is an object, not a string;
read it with `unwrap()`.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>

* test(configuration): wait for the second round rather than assume it

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>

* refactor(configuration)!: read a secret with its own unwrap

Component code depends on no Toa package, so a secret is read as
`context.configuration.apiKey.unwrap()` and the helper in `@toa.io/generic`
goes. A value a component reads as a secret is therefore given as a reference:
`identity.basic` no longer defaults `pepper` to `''`, the development context
and the feature harness give the token keys, the federation client secret and
the signing key as references, and the harness has a step for the secrets a
scenario refers to. CONTRIBUTING states the rule.
* `identity.basic` `pepper` has no default; a value read as a
secret must be given as a `$NAME` reference.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>

* feat(configuration): list the configurations

`configuration.values.list` returns every component's configuration for its
deployed epoch, by component name, and `GET /configuration/values/` serves it
behind `system:configuration:get`.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>

* fix(exposition): write a value in YAML the way its toJSON says

A redacted secret in a reply was dumped as an empty object; it is written as
`<REDACTED>`, as JSON and msgpack already write it.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>

* test(configuration): a secret is an object, and stays redacted in a reply

A component with `{ a: 1, b: $SECRET_B }` returns its configuration as
`{ a: 1, b: '<REDACTED>' }` and the secret itself through `unwrap()`. The reply
step also accepts a reply as a caller across a process boundary receives it,
since a call within the process hands the object over as it is.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>

* chore(schemas): bump the dependencies

ajv 8.18.0 to 8.20.0, ajv-formats 2.1.1 to 3.0.1, better-ajv-errors 1.2.0
to 2.0.3, fast-glob 3.2.12 to 3.3.3 and js-yaml 4.3.1 to 5.4.1 — the version
exposition already uses. The three majors keep the CommonJS entry points this
library calls: ajv-formats as a function, better-ajv-errors as .default, and
js-yaml's load.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

* feat(configuration)!: serve the schema with the value

GET /configuration/values/:component/ answers { configuration, schema, epoch }
where it answered with the configuration alone, and list carries the schema of
every component. Nothing reads a configuration without needing to know what it
is checked against, and the schema was only ever on the values service.

An epoch the deployment does not know has no schema; the value stored for it
is still returned.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

* feat(configuration): publish a configuration UI

The values service serves a page at /.configuration on port 8003, out of the
directory ui builds: the configured components, a screen per component showing
what it holds now, and a dialog creating the next one. Reading needs
system:configuration:get and creating needs system:configuration:create.

A configuration is immutable, so the dialog opens on the current value and what
is left out of it is left out of the component. The editor takes YAML, the
schema is applied before anything is sent, and a secret is a reference the page
never shows.

The page is always published: the annotation is the per-component values map
and has nowhere to carry a switch.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

* feat(introspection): link a component to its configuration

A card carrying @toa.io/extensions.configuration reads that extension as a link
to the configuration UI rather than as a name, and configuration joins the
namespaces the runtime provides, so its components band under System.

Deployed, both pages sit behind the same ingress and the path alone is right;
locally each console has its own port.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

* feat(introspection): scroll the map, zoom with a modifier

The map was grabbed to move and zoomed with a bare wheel, which is neither what
a page does nor what the wheel does anywhere else. A plain scroll now pans on
both axes and the wheel scales only with the modifier held — a trackpad pinch
arrives as one of those on every platform.

A card's own scrollable box keeps its wheel, in both paths.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

* refactor(introspection): centre the filter in the header

The sides take equal space, which is what leaves the filter between them.
Neither side may shrink under what it holds, or the tabs run out from under
their side and across the filter, and the filter across the sign-out button;
the title gives way instead.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

* fix(configuration): connect the UI to the values service

The page was declared as a dependency from inside `open`, and a connector connects
what it depends on before `open` runs — so the server was constructed and never
listened. Nothing caught it: the UI feature builds the server itself.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

* feat(configuration)!: reserve resources in the annotation

The values service deploys like any other and must state what it may take, but the
annotation is a map of component ids and had nowhere to put it — so `toa env` failed
for every context using configuration unless it declared a context-wide `resources`.

`resources` is now the service's own, read the way `introspection` and `realtime` read
theirs. A component actually named `resources` is written `default.resources`, which is
what its id is anyway.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

* feat(configuration): follow the system colour scheme

The dark tokens were behind a `.dark` class nothing sets, and the `dark:` variant was
pointed at that class too — so a component's own dark styling never applied either.
Both now key off `prefers-color-scheme`, and `color-scheme` hands the native chrome
the same answer.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

* feat(introspection): follow the system colour scheme

The dark tokens were behind a `.dark` class nothing sets, and the `dark:` variant was
pointed at that class too — so a component's own dark styling never applied either.
Both now key off `prefers-color-scheme`, and `color-scheme` hands the native chrome
the same answer.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

* feat(configuration): present a change as an edit of what is there

A configuration is immutable and creating one replaces the whole of it, but the dialog
opens on the current value and the page never shows an older one — so what the reader
does is edit. The words follow: Edit rather than New, Update rather than Create, and
the paragraph explaining the model goes, along with the field's label, which the title
above it already said.

The editor also stayed as wide as its longest line — `field-sizing: content` sizes to
content, and no `max-width` clamps that — so a long value painted outside the dialog.
It is fixed now, the dialog takes the width the screen has rather than a fixed step,
and the band held for errors no longer leaves a gap when there are none.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

* feat(configuration): mark a component that keeps a secret

A key after the name on the row, wherever the configuration holds a reference, however
deep. The predicate reads the same lines the value screen renders, so the two cannot
disagree about what counts as a secret.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

* feat(configuration): lead back to the list from the title

Every address ends in a slash, so the way up is the address itself on the list and one
level above it on a component's screen — which holds wherever the page is mounted.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>





# [1.0.0-alpha.273](https://github.com/toa-io/toa/compare/v1.0.0-alpha.272...v1.0.0-alpha.273) (2026-09-02)


### Bug Fixes

* **exposition:** green the feature suite ([67c25ad](https://github.com/toa-io/toa/commit/67c25ad627db3b3779b09405c5a3c319ecd47722))
* **exposition:** keep a departing tenant from taking a branch back ([64a4eaf](https://github.com/toa-io/toa/commit/64a4eafc9122fabba7b59bf7d559a9d4ef36f773))
* **exposition:** remove redundant inputs ([34763e4](https://github.com/toa-io/toa/commit/34763e417c93c4eecc5f96879a68c2b68bd6b8a8))
* **exposition:** report a refreshed branch at trace ([4f170ef](https://github.com/toa-io/toa/commit/4f170ef529a04755b22494789407305f11ce395e))





# [1.0.0-alpha.272](https://github.com/toa-io/toa/compare/v1.0.0-alpha.271...v1.0.0-alpha.272) (2026-09-01)


### Bug Fixes

* **core:** stop the reply contract from relaxing the declaration ([6222893](https://github.com/toa-io/toa/commit/622289326630b94deff93499d6a851bfaa57c69a))
* **exposition:** close the query string, and tell it about sample ([ba82e61](https://github.com/toa-io/toa/commit/ba82e617f9d6e18b2c01ee68661407a781952443))
* **exposition:** stop a tenant announcing on its way out ([e1926fe](https://github.com/toa-io/toa/commit/e1926fe53186d9044c502e84f5894b6fbce88011))
* **exposition:** stop the throttling ticker before what it calls goes down ([f770740](https://github.com/toa-io/toa/commit/f770740a8359762b10cd456bc64e259415f7ef75))


* refactor(exposition)!: meter through the atom ([aa9c8f1](https://github.com/toa-io/toa/commit/aa9c8f16de3f4d315b14c49ff0b4f203053ede2c))


### BREAKING CHANGES

* `context.stash.meter` is gone; meter through `context.atom` instead.
A deployment that declared a stash for `exposition.stash` can drop it, and needs
`atomicity.redis` set for throttling to reconcile.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>





# [1.0.0-alpha.271](https://github.com/toa-io/toa/compare/v1.0.0-alpha.270...v1.0.0-alpha.271) (2026-08-31)


### Bug Fixes

* **exposition:** ship the stash component's meter operation ([dee5ae4](https://github.com/toa-io/toa/commit/dee5ae43cd34581e10192c071d9dd673213a28c6))





# [1.0.0-alpha.270](https://github.com/toa-io/toa/compare/v1.0.0-alpha.269...v1.0.0-alpha.270) (2026-08-31)


* feat(exposition)!: throttle by a distributed GCRA ([287eb25](https://github.com/toa-io/toa/commit/287eb254b11339b20ef011deb659eb11f225defe))


### Performance Improvements

* **exposition:** project io restrictions through a set ([d70b364](https://github.com/toa-io/toa/commit/d70b36478626dd29958a55ebf72f0373e07e34f5))
* **exposition:** stop recomputing per-request what a route fixes ([b52f335](https://github.com/toa-io/toa/commit/b52f335023e58db42a21f1ee6bd99470e8547a2c))
* **exposition:** tag a reply from the body already encoded ([e6ea7d7](https://github.com/toa-io/toa/commit/e6ea7d7b169783becddb2854ae6fb24caf611398))
* **openspan:** create a span only when something records it ([a6efb0e](https://github.com/toa-io/toa/commit/a6efb0eed38393f4c169b067f23d7447f0169bca))


### BREAKING CHANGES

* `io:throttle` no longer takes `cooldown`, and its schema now
rejects unknown properties, so a declaration carrying one fails at boot instead of
being ignored quietly. Metering earns the budget back rather than locking a key
out, so the lockout is expressed as a rate: `requests: 20, interval: 600` admits a
burst of twenty and then one every thirty seconds, where `requests: 20, interval:
60, cooldown: 600` used to refuse everything for ten minutes. The stash aspect's
`count` is replaced by `meter`, which takes a batch of keys and debts and answers
what the group has reached.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>





# [1.0.0-alpha.269](https://github.com/toa-io/toa/compare/v1.0.0-alpha.268...v1.0.0-alpha.269) (2026-08-30)


### Bug Fixes

* **exposition:** check input restrictions before directives add to the body ([b37961a](https://github.com/toa-io/toa/commit/b37961aa43b8ea52fbbbfd8d447fd20a71fbbef6))





# [1.0.0-alpha.268](https://github.com/toa-io/toa/compare/v1.0.0-alpha.267...v1.0.0-alpha.268) (2026-08-30)


### Bug Fixes

* **agent:** do not append a content-length a request already declares ([17893e9](https://github.com/toa-io/toa/commit/17893e9bc8c64c744dac2ad7cf057267a0932afb))
* **exposition:** make the allowed CORS headers stable and per-gateway ([2ea3554](https://github.com/toa-io/toa/commit/2ea3554ad61bd4dc9246cebc30cad6cf553dcce5))
* **exposition:** report the entity length on HEAD ([bf20086](https://github.com/toa-io/toa/commit/bf2008672d5f192bdeffa5d7c1d46fef7e06ea7b))
* **exposition:** serialize the error a failed workflow step reports ([c11a3a6](https://github.com/toa-io/toa/commit/c11a3a6ecdf177227679bad590a886753cbdf2a5))
* **exposition:** type the throttle key declaration precisely ([ac7d486](https://github.com/toa-io/toa/commit/ac7d4865f689f1a77f65ed3262da47fd49b62e81))





# [1.0.0-alpha.267](https://github.com/toa-io/toa/compare/v1.0.0-alpha.266...v1.0.0-alpha.267) (2026-08-29)

**Note:** Version bump only for package @toa.io/extensions.exposition





# [1.0.0-alpha.266](https://github.com/toa-io/toa/compare/v1.0.0-alpha.265...v1.0.0-alpha.266) (2026-08-29)

**Note:** Version bump only for package @toa.io/extensions.exposition





# [1.0.0-alpha.265](https://github.com/toa-io/toa/compare/v1.0.0-alpha.264...v1.0.0-alpha.265) (2026-08-29)

**Note:** Version bump only for package @toa.io/extensions.exposition





# [1.0.0-alpha.264](https://github.com/toa-io/toa/compare/v1.0.0-alpha.263...v1.0.0-alpha.264) (2026-08-29)

**Note:** Version bump only for package @toa.io/extensions.exposition





# [1.0.0-alpha.263](https://github.com/toa-io/toa/compare/v1.0.0-alpha.262...v1.0.0-alpha.263) (2026-08-29)


### Bug Fixes

* **exposition:** cancel the discovery settle timeout ([0124c9f](https://github.com/toa-io/toa/commit/0124c9f8956722b967681ac7bd49a26556761e66))


### Performance Improvements

* **exposition:** let the probe own the startup delay ([1cb8e04](https://github.com/toa-io/toa/commit/1cb8e0459981d0a47c68dce48e17fa1fceb79a61))
* **exposition:** settle discovery as soon as the branches go quiet ([d40bafd](https://github.com/toa-io/toa/commit/d40bafd5b6c71f34a2fcac201697823870460fa5))





# [1.0.0-alpha.262](https://github.com/toa-io/toa/compare/v1.0.0-alpha.261...v1.0.0-alpha.262) (2026-08-28)


### Bug Fixes

* **exposition:** serve endpoints declared in the context annotation ([49da8a4](https://github.com/toa-io/toa/commit/49da8a4234ee987b25023952d0622ce575dfb60c))
* **introspection:** return the whole map over HTTP ([053c0cd](https://github.com/toa-io/toa/commit/053c0cd5c22b1a80bceb23d2cda68ede33a0d1c0))


### Features

* **core:** identify the origin of a call with `request.source` ([9da6b66](https://github.com/toa-io/toa/commit/9da6b66df852690351a1e82c7b8cc176fd89774a))
* **operations:** let a service claim a path prefix on the host ([02677d1](https://github.com/toa-io/toa/commit/02677d17fcd4222b07c3be458d93bcc496a016a8))





# [1.0.0-alpha.259](https://github.com/toa-io/toa/compare/v1.0.0-alpha.258...v1.0.0-alpha.259) (2026-08-24)

**Note:** Version bump only for package @toa.io/extensions.exposition





# [1.0.0-alpha.258](https://github.com/toa-io/toa/compare/v1.0.0-alpha.257...v1.0.0-alpha.258) (2026-08-24)


### Bug Fixes

* **exposition:** accept federation signature key as PEM ([121fb00](https://github.com/toa-io/toa/commit/121fb00a4e84ec31d65aa1f747f2a22770db9ba1))





# [1.0.0-alpha.257](https://github.com/toa-io/toa/compare/v1.0.0-alpha.256...v1.0.0-alpha.257) (2026-08-24)


### Bug Fixes

* **exposition:** allow null output of basic credentials info ([2a98d0c](https://github.com/toa-io/toa/commit/2a98d0c4c7dd510d57f23485fd516990c79e6759))
* **exposition:** re-add deleted basic credentials ([93abdb7](https://github.com/toa-io/toa/commit/93abdb7c97f807d400a236c417af716dbd367189))
* **exposition:** return identity id from federation inception ([4ddcb7e](https://github.com/toa-io/toa/commit/4ddcb7ee7e574d79f783816190381b5bd6eb2dce))
* **exposition:** revive deleted federation credential on create ([89e6363](https://github.com/toa-io/toa/commit/89e6363778a5e503957c339d1626cda0827fbed8))
* **storages.mongodb:** lift tombstone on set ([b33d227](https://github.com/toa-io/toa/commit/b33d227dbe1d6c95957d67d31bbe2543e1def8c1))


### Features

* **exposition:** add federation create operation ([0262d7d](https://github.com/toa-io/toa/commit/0262d7d18362d580fc1dd923225c9acba01e751a))
* **exposition:** detach federation credential id from identity ([63a54e4](https://github.com/toa-io/toa/commit/63a54e44a63c846886d7ed55b29de3e85b4725ff))
* **exposition:** return the credential from federation inception ([fced302](https://github.com/toa-io/toa/commit/fced302d16979d234f5a3dbf0ed3897362e95b90))
* **exposition:** unique federation credential per identity and issuer ([0c3e11b](https://github.com/toa-io/toa/commit/0c3e11b2e2497319dc66d566330f8e03c4e35f8d))





# [1.0.0-alpha.256](https://github.com/toa-io/toa/compare/v1.0.0-alpha.255...v1.0.0-alpha.256) (2026-08-23)


### Features

* add toa mono and discover components at components/* ([787a111](https://github.com/toa-io/toa/commit/787a111c8f83e56ebc734801c97106c585d034ea))
