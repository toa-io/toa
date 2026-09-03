# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.278](https://github.com/toa-io/toa/compare/v1.0.0-alpha.277...v1.0.0-alpha.278) (2026-09-03)

**Note:** Version bump only for package @toa.io/extensions.introspection





# [1.0.0-alpha.277](https://github.com/toa-io/toa/compare/v1.0.0-alpha.276...v1.0.0-alpha.277) (2026-09-03)

### Bug Fixes

* drop the build output that landed beside the sources ([a724f69](https://github.com/toa-io/toa/commit/a724f6921190e5c9d945e33c6035bb12d832e5c8))
* settle what the module loader made asynchronous ([d4ab9df](https://github.com/toa-io/toa/commit/d4ab9dfb09e382da311dba08f52214e7645f4a6c))


# [1.0.0-alpha.275](https://github.com/toa-io/toa/compare/v1.0.0-alpha.274...v1.0.0-alpha.275) (2026-09-02)


### Bug Fixes

* **configuration:** ship the component's code and the built page ([6ffe988](https://github.com/toa-io/toa/commit/6ffe988a9e67025c114e74ba94665b28a2cafaa1))
* **introspection:** draw a band to the width of the map ([b70650b](https://github.com/toa-io/toa/commit/b70650b0c91ac49945e887b30d1953836814226b))
* **introspection:** keep a sideways scroll off the browser's back gesture ([419e012](https://github.com/toa-io/toa/commit/419e012ce093bcd0429dc93fe457bbd964cfc11c))


### Features

* **ui:** give both consoles a favicon ([27d3881](https://github.com/toa-io/toa/commit/27d3881eda10e59dc4c9c5ef38c2a58b71e1448d))
* **ui:** leave signing out to its icon ([a82fbab](https://github.com/toa-io/toa/commit/a82fbab513706436254348a5e35115dc3721873f))





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

**Note:** Version bump only for package @toa.io/extensions.introspection





# [1.0.0-alpha.272](https://github.com/toa-io/toa/compare/v1.0.0-alpha.271...v1.0.0-alpha.272) (2026-09-01)

**Note:** Version bump only for package @toa.io/extensions.introspection





# [1.0.0-alpha.270](https://github.com/toa-io/toa/compare/v1.0.0-alpha.269...v1.0.0-alpha.270) (2026-08-31)


### Performance Improvements

* stop rebuilding per-call values that never change ([4202504](https://github.com/toa-io/toa/commit/4202504c33fb9ef9694f9995f3d0397d3a186438))





# [1.0.0-alpha.268](https://github.com/toa-io/toa/compare/v1.0.0-alpha.267...v1.0.0-alpha.268) (2026-08-30)


### Bug Fixes

* **introspection:** treat exposition as a system namespace ([0374f22](https://github.com/toa-io/toa/commit/0374f229a0c822763c3d92c6384a61d66269a8cc))





# [1.0.0-alpha.266](https://github.com/toa-io/toa/compare/v1.0.0-alpha.265...v1.0.0-alpha.266) (2026-08-29)

**Note:** Version bump only for package @toa.io/extensions.introspection





# [1.0.0-alpha.265](https://github.com/toa-io/toa/compare/v1.0.0-alpha.264...v1.0.0-alpha.265) (2026-08-29)

**Note:** Version bump only for package @toa.io/extensions.introspection





# [1.0.0-alpha.264](https://github.com/toa-io/toa/compare/v1.0.0-alpha.263...v1.0.0-alpha.264) (2026-08-29)


### Bug Fixes

* **introspection:** stop the counts row being cut short ([8123fd5](https://github.com/toa-io/toa/commit/8123fd5d53e290cc0f6c05d30371af63572be5e6))





# [1.0.0-alpha.263](https://github.com/toa-io/toa/compare/v1.0.0-alpha.262...v1.0.0-alpha.263) (2026-08-29)


### Bug Fixes

* **introspection:** retain edges for seven days ([9b2c988](https://github.com/toa-io/toa/commit/9b2c988faddefad6a5b3a70d887f3e9a58d38b16))


### Features

* **introspection:** give a service its own mark ([a01d66f](https://github.com/toa-io/toa/commit/a01d66fb7068efa5db45cddfdf24658b0d6dd92d))
* **introspection:** limit topology update windows ([9b4cfab](https://github.com/toa-io/toa/commit/9b4cfab196f4b4b3e6f3af201c973df837cfa28a))
* **introspection:** name the counts by what they are ([7244ba8](https://github.com/toa-io/toa/commit/7244ba86a7f9c2dd42cd22847082e20da325bc77))





# [1.0.0-alpha.262](https://github.com/toa-io/toa/compare/v1.0.0-alpha.261...v1.0.0-alpha.262) (2026-08-28)


### Bug Fixes

* **introspection:** keep the collector off the critical path ([965ec77](https://github.com/toa-io/toa/commit/965ec77482d361a5a9a88579152158c7e1c79e66))
* **introspection:** meet a card across the edge the line touches ([2002de9](https://github.com/toa-io/toa/commit/2002de9bdc12400abc64d5234fa319339db4588f))
* **introspection:** return the whole map over HTTP ([053c0cd](https://github.com/toa-io/toa/commit/053c0cd5c22b1a80bceb23d2cda68ede33a0d1c0))
* **introspection:** serve a route that looks like a file ([b43bbb4](https://github.com/toa-io/toa/commit/b43bbb4a290819463c61bcba64357385c2423d25))
* **introspection:** show the lines an opened neighbour sends ([5fe8aed](https://github.com/toa-io/toa/commit/5fe8aed64c1f1e54f1c10e29b91b50c5cdc296ab))
* **introspection:** wait for the page before capturing it ([9e63af3](https://github.com/toa-io/toa/commit/9e63af34ee090a4f90dce9658b0d022f4acae50f))


* feat(introspection)!: publish the UI ([81fe2cb](https://github.com/toa-io/toa/commit/81fe2cb4bafe91e74d3af8359327e3102e5b0e8a))


### Features

* **introspection:** act on the only thing the filter left ([1a83709](https://github.com/toa-io/toa/commit/1a8370987b7d60c009f4d58f07005618899cdfd6))
* **introspection:** add the introspection extension ([a07ed86](https://github.com/toa-io/toa/commit/a07ed8651404258d544f3b6d8236e58cf4da09ac))
* **introspection:** animate a card opening on the map ([1d2180f](https://github.com/toa-io/toa/commit/1d2180f48fb9dc18d9fa0c2cc4eefa6f46626898))
* **introspection:** animate every collapsible from one place ([0b6a32b](https://github.com/toa-io/toa/commit/0b6a32b69128f2db2d3e449896614ff478f2775b))
* **introspection:** ask for the role rather than be refused it ([1ad01a7](https://github.com/toa-io/toa/commit/1ad01a7dd817ae37ed84e3a3b6b20b72049a4216))
* **introspection:** cache the map API ([f550c27](https://github.com/toa-io/toa/commit/f550c2780a80bbe2fdd131984c33d9848daa8c82))
* **introspection:** fold away a component's extensions ([de1bea6](https://github.com/toa-io/toa/commit/de1bea6329a1fd920cff6b5ad9a13eedfc527884))
* **introspection:** give a card's rows their own space ([3253639](https://github.com/toa-io/toa/commit/32536395b9d25e743c25b61deb9dbd5b79d966b6))
* **introspection:** give the map's two screens their own addresses ([90fd5af](https://github.com/toa-io/toa/commit/90fd5af39b8b6c38e22e05df46c70de533eb15c6))
* **introspection:** open a component on the map ([6382740](https://github.com/toa-io/toa/commit/63827403407fc5a305d95e9fde72ed5a99a1499a))
* **introspection:** open an operation onto what it takes ([f16a683](https://github.com/toa-io/toa/commit/f16a683175a89d3660c538768b24cd872b6d0b3d))
* **introspection:** publish the map as a page ([21b16b2](https://github.com/toa-io/toa/commit/21b16b2220a1b26796bdbedc85a0df2a88df31dd))
* **introspection:** say a component's shape in counts ([54aa771](https://github.com/toa-io/toa/commit/54aa771a51c257db759107d584d063916f0cd351))
* **introspection:** say how a silenced card comes back ([6e7674f](https://github.com/toa-io/toa/commit/6e7674f88137cfb780f3a7cac1fc67f191f96984))
* **introspection:** separate what the runtime provides ([289c7a3](https://github.com/toa-io/toa/commit/289c7a301dd0ab9c063a5b77b24745983ec79e29))
* **introspection:** show a schema as a shape ([7d9a595](https://github.com/toa-io/toa/commit/7d9a595d86f88846b21bb79aba82bb332b77fbf6))
* **introspection:** the map is the front page ([dbf1b5f](https://github.com/toa-io/toa/commit/dbf1b5fd6d262aa2aa952bbfe2a6be1e44af6302))


### Performance Improvements

* **introspection:** build a card's details when it shows them ([c10f7c4](https://github.com/toa-io/toa/commit/c10f7c42e51cbef2d3767c36559d846f0e34653a))


### BREAKING CHANGES

* the extension is predefined, so every Context now declares an
ingress and must say where it lands:

    ingress:
      hosts: [api.example.com]

An application that does not want the page says `introspection: { ui: false }`,
and one that wants no map at all says `introspection: false`. Failing the export
is deliberate: the alternative is quietly not publishing a page that was asked
for.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
