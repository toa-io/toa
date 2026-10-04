# Purpose

Work in this directory develops documentation that explains what Toa is: the runtime's
foundational concepts, its main mechanisms, and how they fit together. The goal is conceptual
understanding, not teaching readers how to use it.

# Routines

## Approved content

The user marks approved content with `<!--ok-->...<!--/ok-->`. Everything enclosed by these
comment markers is immutable and must not be edited or deleted. Preserve the markers and their
contents exactly.

## Editorial remarks

Text enclosed in `((...))` is an editorial remark to address. Make the necessary changes,
then remove the remark once it has been addressed. Approved content remains immutable.

## Deferred notes

Text enclosed in `<!--todo-->...<!--/todo-->` contains notes or guidance for future work. Leave these
notes and their contents unchanged, and do not act on them unless the user explicitly asks.
Routine requests to process files do not activate these notes.

# Process

Commit or push changes only when the user explicitly requests it.
