# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.284](https://github.com/toa-io/toa/compare/v1.0.0-alpha.283...v1.0.0-alpha.284) (2026-09-05)

### Bug Fixes

* run the feature suites on a fresh checkout ([712a03d](https://github.com/toa-io/toa/commit/712a03d37cca40709e919f9cc996a3d67bea2098))


# [1.0.0-alpha.283](https://github.com/toa-io/toa/compare/v1.0.0-alpha.282...v1.0.0-alpha.283) (2026-09-04)

### Features

* **cli:** generate an application's types from its manifests ([195ac94](https://github.com/toa-io/toa/commit/195ac94de0d8c9de995847599511782c399768a5))


# [1.0.0-alpha.282](https://github.com/toa-io/toa/compare/v1.0.0-alpha.281...v1.0.0-alpha.282) (2026-09-03)

**Note:** Version bump only for package @toa.io/userland





# [1.0.0-alpha.279](https://github.com/toa-io/toa/compare/v1.0.0-alpha.278...v1.0.0-alpha.279) (2026-09-03)

### Bug Fixes

* **userland:** let a TypeScript consumer find the declarations of `stage` ([c108cb5](https://github.com/toa-io/toa/commit/c108cb545d62204339b924f47f3863b8c40831d3))


# [1.0.0-alpha.278](https://github.com/toa-io/toa/compare/v1.0.0-alpha.277...v1.0.0-alpha.278) (2026-09-03)

**Note:** Version bump only for package @toa.io/userland





# [1.0.0-alpha.277](https://github.com/toa-io/toa/compare/v1.0.0-alpha.276...v1.0.0-alpha.277) (2026-09-03)

### Bug Fixes

* settle what the module loader made asynchronous ([d4ab9df](https://github.com/toa-io/toa/commit/d4ab9dfb09e382da311dba08f52214e7645f4a6c))
* what the loader resolves, and what it will not ([1b8a02f](https://github.com/toa-io/toa/commit/1b8a02ff0a5e0f18ee62e3f71bc81116f86f9af1))


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

**Note:** Version bump only for package @toa.io/userland





# [1.0.0-alpha.272](https://github.com/toa-io/toa/compare/v1.0.0-alpha.271...v1.0.0-alpha.272) (2026-09-01)

**Note:** Version bump only for package @toa.io/userland





# [1.0.0-alpha.270](https://github.com/toa-io/toa/compare/v1.0.0-alpha.269...v1.0.0-alpha.270) (2026-08-31)

**Note:** Version bump only for package @toa.io/userland





# [1.0.0-alpha.266](https://github.com/toa-io/toa/compare/v1.0.0-alpha.265...v1.0.0-alpha.266) (2026-08-29)

**Note:** Version bump only for package @toa.io/userland





# [1.0.0-alpha.265](https://github.com/toa-io/toa/compare/v1.0.0-alpha.264...v1.0.0-alpha.265) (2026-08-29)

**Note:** Version bump only for package @toa.io/userland





# [1.0.0-alpha.264](https://github.com/toa-io/toa/compare/v1.0.0-alpha.263...v1.0.0-alpha.264) (2026-08-29)

**Note:** Version bump only for package @toa.io/userland





# [1.0.0-alpha.263](https://github.com/toa-io/toa/compare/v1.0.0-alpha.262...v1.0.0-alpha.263) (2026-08-29)

**Note:** Version bump only for package @toa.io/userland





# [1.0.0-alpha.262](https://github.com/toa-io/toa/compare/v1.0.0-alpha.261...v1.0.0-alpha.262) (2026-08-28)


### Bug Fixes

* **stage:** name the feature suite as the caller ([e4e593b](https://github.com/toa-io/toa/commit/e4e593b795cc7dc113f06e8a1554ae2ef36442c0))





# [1.0.0-alpha.259](https://github.com/toa-io/toa/compare/v1.0.0-alpha.258...v1.0.0-alpha.259) (2026-08-24)

**Note:** Version bump only for package @toa.io/userland





# [1.0.0-alpha.257](https://github.com/toa-io/toa/compare/v1.0.0-alpha.256...v1.0.0-alpha.257) (2026-08-24)

**Note:** Version bump only for package @toa.io/userland





# [1.0.0-alpha.256](https://github.com/toa-io/toa/compare/v1.0.0-alpha.255...v1.0.0-alpha.256) (2026-08-23)


### Features

* add toa mono and discover components at components/* ([787a111](https://github.com/toa-io/toa/commit/787a111c8f83e56ebc734801c97106c585d034ea))
