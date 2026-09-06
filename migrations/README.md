# Migrations

What a release broke, and what to do about it. Upgrading from `1.0.0-alpha.279` and reading
forwards, `279.md` is the first file to read and `283.md` the last; a version with no file of its
own broke nothing.

## A file is named after the version it breaks

`283.md` is read by whoever runs `1.0.0-alpha.283`. It says what stops working when they leave it,
and what to write instead.

The name is the version being left rather than the one being arrived at, because that is the one
that is known when the note is written. A break is written where it is made, and what release will
carry it is not decided there: work sits on `dev` until a release takes it, and which release that
is depends on what else lands first. The version it breaks is on the shelf already — it is what
`lerna.json` says.

## Writing one

Add to the file named by the version in `lerna.json`, creating it if it is not there. Everything
broken while that version is the published one goes in that one file, whether it is released as
the next version or the tenth.

Say what a reader has to change, in the terms they wrote it in — the declaration, the call, the
value — and end with a numbered list of what to do where the note covers more than one thing.
Nothing about how the change works inside; that belongs beside the code.
