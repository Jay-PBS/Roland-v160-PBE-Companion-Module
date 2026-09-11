# Roland v160 : Purple Badger Edition

A Bitfocus Companion module for the **Roland V-160HD** HD video switcher.

> ## ⚠️ THIS MODULE IS UNDER LIVE DEVELOPMENT AND SHOULD NOT BE USED ON A LIVE PRODUCTION
>
> It has not yet been verified against real hardware. See
> [CODE_REVIEW.md](CODE_REVIEW.md) for exactly what is and is not proven, and
> [TESTING-NEXT.md](TESTING-NEXT.md) for the checklist awaiting a switcher.
>
> **Testing is welcome, and discussions & issues are open.** If you have a
> V-160HD and are willing to run the checklist, that is the single most useful
> contribution right now.

This is a **fork / modernization** of the original MIT-licensed module
[`bitfocus/companion-module-roland-v160hd`](https://github.com/bitfocus/companion-module-roland-v160hd)
by Joseph Adams. The original copyright notice is retained in [LICENSE](LICENSE),
as required by the MIT license. Many thanks to the original author and sponsors.

This fork is a public repository only — it is **not** distributed through the
Bitfocus marketplace.

## What changed in this fork

- Full rewrite to the modern Companion TypeScript module standard
  (`@companion-module/base` 2.x, typed schema, ESM, Yarn 4, flat ESLint config).
- A complete preset library covering every action, organized by category.
- Bug fixes found during the port (see [CHANGELOG.md](CHANGELOG.md)).
- A hardened connection layer: buffered receive framing, a real login state
  machine that cannot trip the switcher's lockout, a watchdog for links that die
  silently, and the passcode held in Companion's secrets store. See
  [CODE_REVIEW.md](CODE_REVIEW.md) for the full findings, what is still
  unverified, and the hardware test checklist.

The device I/O (TCP port 8023, `DTH:`/`RQH:` text commands) is preserved
byte-for-byte from the original module, except where the original was provably
broken — every wire-affecting change is flagged in the changelog and needs
verification against real hardware before being relied upon. This is checked
mechanically: all 76 action callbacks are run against a recording stub and their
emitted bytes compared against the previous build.

One deliberate exception, in 1.1.0: memory names are no longer re-read on every
poll cycle (240 of the old 271 requests). The per-cycle command set is otherwise
unchanged and in the same order — only the cadence differs.

## Requirements

- Roland V-160HD running firmware 1.04 or higher.
- LAN control enabled with a password/passcode set on the switcher.

## Development

```
corepack enable
yarn install
yarn build      # type-check + emit to dist/
yarn lint       # type-aware lint
yarn package    # build distributable
```

## License

MIT — see [LICENSE](LICENSE).
