# Globals

Shared theme tokens, Tailwind variants, and utility classes for antcn components.

## What's included

| Kind | Examples |
| --- | --- |
| CSS variables | `--constructive`, `--constructive-foreground`, `--destructive-foreground`, `--shadow-color` → `bg-constructive`, `text-constructive-foreground`, `text-destructive-foreground`, popover shadows |
| Custom variants | `standalone:`, `tim:` |
| Shared layers | `@layer transitions` — `transition-morph` / `transition-spring` / `transition-instant` timing, reduced-motion guard |
| Utility classes | `.no-scrollbar` — hide scrollbars while keeping scroll; `.selected` — accent ring for selected rows |
| Typography | `.typeset` — document rhythm for rendered Markdown, sized relative to its container |

Component-specific view-transition rules stay in each component's `<style>` block.

## Typography

`.typeset` is [shadcn/typeset](https://ui.shadcn.com/docs/typeset), snapshotted from <https://ui.shadcn.com/typeset.css> on 2026-08-05. It has no registry entry and no npm package — it ships as a file plus a web builder, so it is vendored here as `typeset.css` and refreshing it is a diff against a fresh download.

The file ships verbatim: `globals` carries it as a `registry:file` targeting `src/lib/typeset.css`, and its `css` carries the matching `@import '$lib/typeset.css'` key, which the CLI merges into your stylesheet — so after install you own a readable `typeset.css` and it is already wired. Edit it like any other file in your project.

The deviation, one rule: upstream nests lists with a bare `:where(ul ul)`, so a structural `<ul>` _outside_ the typeset container counts as a nesting level and Markdown lists render `circle`. It is scoped to `.typeset ul ul` (and `.typeset ul ul ul`) instead. This is generic — any layout that puts a Markdown container inside a list hits it.

Put the class on the element that roots a whole document, not on each Markdown fragment, so headings and prose share one typographic root. Elements inside it that are structure rather than prose opt out with explicit utilities — note that Tailwind v4 implements `space-y-*` as `margin-block-end`, which collides with typeset's list spacing, so spacing between structural items wants an explicit margin instead.

## After install

Installing or re-installing globals merges its `css` and `cssVars` into your project CSS (usually `src/app.css`). Simple tokens dedupe reliably; **complex selectors** — `@layer transitions`, `@custom-variant`, comma-grouped `::view-transition-*` rules — match by exact formatting. If your file is pretty-printed differently from what the CLI emits, overwrite may fail and rules get **appended as duplicates**.

After each install, check your CSS and **delete duplicate blocks** (most often under `@layer transitions`). Replace the whole bloated section with one copy — don't leave stacked repeats.
